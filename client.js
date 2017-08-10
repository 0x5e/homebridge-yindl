var net = require('net');
var Datagram = require('./datagram');

class YindlClient {
  constructor(host, port) {
    this.addr = {'host': host, 'port': port}
  }

  start() {
    var socket = net.connect(this.addr, this._connected.bind(this));
    socket.setEncoding('binary')
    socket.on('data', this._received.bind(this));
    socket.on('end', this._closed.bind(this))

    this.socket = socket
  }

  _connected() {
    console.info('Connected')
    this._login('yindl', '24325356658776987')
    this._init_knx()

    clearInterval(this.interval)
    this.interval = setInterval(this._heartbeat.bind(this), 60 * 1000)
  }

  _received(data) {
    var buf = new Buffer(data, 'binary')
    console.info('Recv <--- ', buf.toString('hex'))

    var pkg = Datagram.parse(buf)
    if (pkg.type == Datagram.type.Heartbeat_Ack) {
      ;
    } else if (pkg.type == Datagram.type.Login_Ack) {
      console.info('Login success')
    } else if (pkg.type == Datagram.type.Init_KNX_Telegram_Reply) {
      this._knx_update(pkg.data.knx_list)

      var buf = new Buffer(15)
      buf.writeUInt32BE(pkg.data.amount, 6)
      buf.writeUInt32BE(pkg.data.index, 10)
      buf.writeUInt8(pkg.data.count, 14)
      this._send({'type': Datagram.type.Init_KNX_Telegram_Reply_Ack, 'data': buf.toString('binary')})

      if (pkg.data.index - 1 + pkg.data.count == pkg.data.amount) {
        console.info('KNX Telegrams all loaded, count: ', pkg.data.amount)
      }
    } else if (pkg.type == Datagram.type.KNX_Telegram_Event) {
      this._knx_update(pkg.data.knx_list)

      var buf = new Buffer(8)
      buf.writeUInt32BE(pkg.data.count)
      this._send({'type': Datagram.type.KNX_Telegram_Event_Ack, 'data': buf.toString('binary')})
    }
  }

  _closed() {
    console.info('Closed')
  }

  _heartbeat() {
    this._send({'type': Datagram.type.Heartbeat, 'data': '\x7b'})
  }

  _login(usr, psw) {
    this._send({'type': Datagram.type.Login, 'data': {'usr': usr, 'psw': psw}})
  }

  _init_knx() {
    this.knx_dict = {}
    this._send({'type': Datagram.type.Init_KNX_Telegram, 'data': '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'})
  }

  _knx_update(knx_telegram_list) {
    for (var i = 0; i < knx_telegram_list.length; i++) {
      var knx_telegram = knx_telegram_list[i]
      var index = knx_telegram.charCodeAt(3)
      console.info('KNX  <--- ', new Buffer(knx_telegram, 'binary').toString('hex'))
      this.knx_dict[index] = knx_telegram
    }
  }

  _knx_publish(knx_telegram_list) {
    for (var i = 0; i < knx_telegram_list.length; i++) {
      var knx_telegram = knx_telegram_list[i]
      console.info('KNX  ---> ', new Buffer(knx_telegram, 'binary').toString('hex'))
    }
    this._send({'type': Datagram.type.KNX_Telegram_Publish, 'knx_list': knx_telegram_list})
  }

  _send(obj) {
    var pkg = Datagram.build(obj)
    console.info('Send ---> ', pkg.toString('hex'))
    this.socket.write(pkg)
  }

}

module.exports = YindlClient