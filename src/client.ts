import net from 'net';
import EventEmitter from 'events';

const YINDL_STX = 0xea61ea60
const YINDL_VER = 0x01
const YINDL_SEQ = 0x00000000
const YINDL_ETX = 0xea62ea63

const YINDL_TYPE = {
  Heartbeat: 0x0000,
  Heartbeat_Ack: 0x0001,
  Login: 0x0500, // 1280
  Login_Ack: 0x0501, // 1281
  Init_KNX_Telegram: 0x0603, // 1539
  Init_KNX_Telegram_Reply: 0x0604, // 1540
  Init_KNX_Telegram_Reply_Ack: 0x0605, // 1541
  KNX_Telegram_Event: 0x0606, // 1542
  KNX_Telegram_Event_Ack: 0x0607, // 1543
  KNX_Telegram_Publish: 0x0608, // 1544
  KNX_Telegram_Publish_Ack: 0x0609, // 1545
}

const YINDL_USERNAME = 'yindl'
const YINDL_PASSWORD = '24325356658776987'

function bcc_checksum (str) {
  var bcc = 0x00
  for (var i = 0; i < str.length; i++) {
    bcc ^= str.charCodeAt(i)
  }
  return bcc
}


export class YindlClient extends EventEmitter {
  private socket?: net.Socket;
  private interval?: NodeJS.Timer;

  public knx_state = {};

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {
    super();
  }

  start() {
    var socket = net.connect({'host': this.host, 'port': this.port}, this.onConnected.bind(this))
    socket.setEncoding('binary')
    socket.on('data', this.onDataReceived.bind(this))
    socket.on('end', this.onClosed.bind(this))

    this.socket = socket
  }

  // socket event -

  onConnected() {
    console.info('[YINDL] onConnected')
    this.login(YINDL_USERNAME, YINDL_PASSWORD)

    clearInterval(this.interval)
    this.interval = setInterval(this.heartbeat.bind(this), 60 * 1000)
  }

  onDataReceived(data) {
    var buf = Buffer.from(data, 'binary')
    // console.debug('[YINDL] onDataReceived:', buf.toString('hex'))

    var type = buf.readUInt16BE(11)
    var len = buf.readUInt16BE(13) - 4
    var payload = buf.slice(15, 15 + len)

    if (type == YINDL_TYPE.Heartbeat_Ack) {
      ;
    } else if (type == YINDL_TYPE.Login_Ack) {
      console.info('[YINDL] Login success')
      this.init_knx()
    } else if (type == YINDL_TYPE.Init_KNX_Telegram_Reply) {
      var amount = payload.readUInt32BE(6)
      var index = payload.readUInt32BE(10)
      var count = payload.readUInt8(14)
      // console.debug('[YINDL] Init KNX Telegram Reply: amount =', amount, 'index =', index, 'count =', count)
      var knx_telegram_list: Buffer[] = []
      for (var i = 15; i <= payload.length - 11; i += 11) {
        knx_telegram_list.push(payload.slice(i, i + 11))
      }

      this.onKNXUpdate(knx_telegram_list)

      var buf = Buffer.alloc(15)
      buf.writeUInt32BE(amount, 6)
      buf.writeUInt32BE(index, 10)
      buf.writeUInt8(count, 14)
      this.send(YINDL_TYPE.Init_KNX_Telegram_Reply_Ack, buf)

      if (index - 1 + count == amount) {
        // console.debug('[YINDL] KNX Telegrams all loaded')
        this.emit('loaded', this.knx_state)
      }
    } else if (type == YINDL_TYPE.KNX_Telegram_Event) {
      var count = payload.readUInt16BE(6)
      var knx_telegram_list: Buffer[] = []
      for (var i = 8; i <= payload.length - 11; i += 11) {
        knx_telegram_list.push(payload.slice(i, i + 11))
      }

      this.onKNXUpdate(knx_telegram_list)

      var buf = Buffer.alloc(8)
      buf.writeUInt8(count, 7)
      this.send(YINDL_TYPE.KNX_Telegram_Event_Ack, buf)
    } else if (type == YINDL_TYPE.KNX_Telegram_Publish_Ack) {
      ;
    }
  }

  onClosed() {
    console.info('[YINDL] onClosed')
    // TODO reconnect
  }

  // knx method -

  heartbeat() {
    var buf = Buffer.alloc(1)
    buf.writeUInt8(0x7b, 0)
    this.send(YINDL_TYPE.Heartbeat, buf)
  }

  login(usr, psw) {
    var buf = Buffer.alloc(usr.length + psw.length + 4)
    buf.writeUInt16BE(usr.length, 0)
    buf.write(usr, 2)
    buf.writeUInt16BE(psw.length, usr.length + 2)
    buf.write(psw, usr.length + 4)
    this.send(YINDL_TYPE.Login, buf)
  }

  init_knx() {
    this.knx_state = {}
    var buf = Buffer.alloc(13)
    this.send(YINDL_TYPE.Init_KNX_Telegram, buf)
  }

  telegram_publish(id, value) {
    value = parseInt(value)
    console.log(`写入数据->ID=${id}    DATA=${value}`)
    this.knx_state[id] = value

    var telegram = Buffer.alloc(11)
    telegram.writeUInt8(id, 3)
    telegram.writeUInt8(0x0f, 4)
    telegram.writeUInt8(0x04, 6)
    telegram.writeFloatBE(value, 7)
    
    var telegrams = [telegram] // TODO multiple publish

    var buf = Buffer.alloc(8 + telegrams.length * 11)
    buf.writeUInt16BE(telegrams.length, 6)
    for(var i = 0; i < telegrams.length; i ++) {
      telegrams[i].copy(buf, 8 + i * 11, 0, 11)
    }

    this.send(YINDL_TYPE.KNX_Telegram_Publish, buf)
  }

  send(type, payload) {
    var buf = Buffer.alloc(20 + payload.length)

    buf.writeUInt32BE(YINDL_STX, 0)
    buf.writeUInt8(YINDL_VER, 4)
    buf.writeUInt16BE(buf.length, 5) // len
    buf.writeUInt32BE(YINDL_SEQ, 7)
    buf.writeUInt16BE(type, 11)
    buf.writeUInt16BE(payload.length + 4, 13) // payload.len

    payload.copy(buf, 15, 0, payload.length)

    let bcc = bcc_checksum(buf.toString('binary', 4, 15 + payload.length))
    buf.writeUInt8(bcc, 15 + payload.length)
    buf.writeUInt32BE(YINDL_ETX, 16 + payload.length)
    
    // console.debug('[YINDL] Send:', buf.toString('hex'))
    if (this.socket) {
      this.socket.write(buf);
    }
  }

  // knx event -

  onKNXUpdate(knx_telegram_list) {
    var output = `新的数据数量: ${knx_telegram_list.length}`
    for (var i = 0; i < knx_telegram_list.length; i++) {
      var knx_telegram = knx_telegram_list[i]
      var id = parseInt(knx_telegram.readUInt8(3))
      var value = parseInt(knx_telegram.readFloatBE(7))
      this.knx_state[id] = value
      this.emit('event', {
        'id': id,
        'value': value,
      })

      output += ` ${id}(${value})`
    }
    console.log(output)
  }

}
