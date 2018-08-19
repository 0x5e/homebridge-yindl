
const STX = 0xea61ea60
const VER = 0x01
const SEQ = 0x00000000
const ETX = 0xea62ea63

const TYPE = {
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

function bcc_checksum (str) {
  var bcc = 0x00
  for (var i = 0; i < str.length; i++) {
    bcc ^= str.charCodeAt(i)
  }
  return bcc
}

class Datagram {

  static get type() {
    return TYPE
  }

  static parse(buf) {
    var obj = {
      'type': buf.readUInt16BE(11),
      'data': buf.toString('binary', 15, len),
    }

    var len = buf.readUInt16BE(13)
    if (obj.type == Datagram.type.Init_KNX_Telegram_Reply) {
      var data = {}
      data.amount = buf.readUInt32BE(21)
      data.index = buf.readUInt32BE(25)
      data.count = buf.readUInt8(29)
      data.knx_list = []
      for (var i = 0; i < data.count; i++) {
        data.knx_list[i] = buf.toString('binary', 30 + i * 11, 41 + i * 11)
      }
      obj.data = data
    } else if (obj.type == Datagram.type.KNX_Telegram_Event) {
      var data = {}
      data.count = buf.readUInt16BE(21)
      data.knx_list = []
      for (var i = 0; i < data.count; i++) {
        data.knx_list[i] = buf.toString('binary', 23 + i * 11, 34 + i * 11)
      }
      obj.data = data
    }

    // console.log(obj)
    return obj
  }

  static build(obj) {
    var buf = new Buffer(2048)
    var len = buf.writeUInt32BE(STX, len)
    len = buf.writeUInt8(VER, len)
    len = buf.writeUInt16BE(0x0000, len) // len
    len = buf.writeUInt32BE(SEQ, len)
    len = buf.writeUInt16BE(obj.type, len)
    len = buf.writeUInt16BE(0x0000, len) // payload.len

    if (obj.type == Datagram.type.Login) {
      len = buf.writeUInt16BE(obj.data.usr.length, len)
      len += buf.write(obj.data.usr, len)
      len = buf.writeUInt16BE(obj.data.psw.length, len)
      len += buf.write(obj.data.psw, len)
    } else if (obj.type == Datagram.type.KNX_Telegram_Publish) {
      len = buf.writeUIntBE(0x000000000000, len, 6) // unknown
      len = buf.writeUIntBE(obj.data.knx_list.length, len, 2)
      for (var i = 0; i < obj.data.knx_list.length; i++) {
        var knx_telegram = obj.data.knx_list[i]
        len += buf.write(knx_telegram, len, knx_telegram.length, 'binary')
      }
    } else {
      len += buf.write(obj.data, len, obj.data.length, 'binary')
    }

    buf.writeUInt16BE(len + 5, 5) // len
    buf.writeUInt16BE(len - 11, 13) // payload.len

    let bcc = bcc_checksum(buf.toString('binary', 4, len))
    len = buf.writeUInt8(bcc, len)
    len = buf.writeUInt32BE(ETX, len)

    buf = buf.slice(0, len)
    return buf

    // let pkg = buf.toString('binary', 0, len)

    // console.log(buf.toString('hex', 0, len))
    // return pkg
  }
}

module.exports = Datagram
