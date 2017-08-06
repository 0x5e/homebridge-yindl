var net = require('net');
var Datagram = require('./datagram');

class YindlClient {
  constructor(host, port) {
    this.addr = {'host': host, 'port': port}
  }

  start() {
    var socket = net.connect(this.addr, this._connected.bind(this));
    socket.on('data', this._received.bind(this));
    socket.on('end', this._closed.bind(this))

    this.socket = socket
  }

  _connected() {
    console.info('Connected')
    this.login('yindl', '24325356658776987')
  }

  _received(data) {
    console.debug('Recv: ' + data)
  }

  _closed() {
    console.info('Closed')
  }

  login(usr, psw) {
    var buf = new Buffer(usr.length + psw.length + 4)
    buf.writeUInt16BE(usr.length, 0)
    buf.write(usr, 2)
    buf.writeUInt16BE(psw.length, usr.length + 2)
    buf.write(psw, usr.length + 4)
    var data = buf.toString()
    this.send({'type': 'Login', 'data': data})
  }

  send(obj) {
    var pkg = Datagram.build(obj)
    console.info('Send: ' + pkg)
    this.socket.write(pkg)
  }

  recv() {
    return {}
  }
}

module.exports = YindlClient