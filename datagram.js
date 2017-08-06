
const STX = 0xea61ea60
const VER = 0x01
const SEQ = 0x00000000
const ETX = 0xea62ea63

const TYPE = {
  Heartbeat: 0x0000,
  Heartbeat_Ack: 0x0001,
  Login: 0x0500,
  Login_Ack: 0x0501,
  Init_KNX_Telegram: 0x0603,
  Init_KNX_Telegram_Reply: 0x0604,
  Init_KNX_Telegram_Reply_Ack: 0x0605,
  KNX_Telegram_Event: 0x0606,
  KNX_Telegram_Event_Ack: 0x0607,
  KNX_Telegram_Publish: 0x0608,
  KNX_Telegram_Publish_Ack: 0x0609,
}

function bcc_checksum (str) {
  var bcc = 0x00
  for (var i = 0; i < str.length; i++) {
    bcc ^= str.charCodeAt(i)
  }
  return bcc
}

class Datagram {

  static get TYPE() {
    return TYPE
  }

  // static parse(stream) {
  //   return Buffer()
  // }

  static build(obj) {
    let pkg_len = obj.data.length + 20
    var len = 0

    var buf = new Buffer(2048)
    len = buf.writeUInt32BE(STX, len)
    len = buf.writeUInt8(VER, len)
    len = buf.writeUInt16BE(pkg_len, len) // len
    len = buf.writeUInt32BE(SEQ, len)
    len = buf.writeUInt16BE(TYPE[obj.type], len)
    len = buf.writeUInt16BE(pkg_len - 16, len) // payload.len
    len += buf.write(obj.data, len, obj.data.length, 'binary')

    // if (obj.type == 'Login') {

    // } else if (obj.type == 'KNX_Telegram_Publish') {
    //   buf.writeUIntBE(0x000000000000, 0, 6) // unknown
    //   buf.writeUIntBE(obj.data.knx_list.length, 0, 2)
    //   obj.data.knx_list.map(buf.write)
    // } else {
    //   buf.write(obj.data)
    // }

    let bcc = bcc_checksum(buf.toString('binary', 4, len))
    len = buf.writeUInt8(bcc, len)
    len = buf.writeUInt32BE(ETX, len)

    let pkg = buf.toString('binary', 0, pkg_len)

    // console.log(buf.toString('hex', 0, pkg_len))
    return pkg
  }
}

module.exports = Datagram