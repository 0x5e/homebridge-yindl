var net = require('net');
var xml2js = require('xml2js');
var xpath = require("xml2js-xpath");

var Datagram = require('./datagram');
var YindlLight = require('./light');

const YINDL_USERNAME = 'yindl';
const YINDL_PASSWORD = '24325356658776987';

class YindlClient {

  constructor(host, port, projectInfo) {
    this.addr = {'host': host, 'port': port};
    this.projectInfo = projectInfo;
    this.lightArray = xpath.find(projectInfo, '//Light').map(value => value.$);
  }

  start() {
    var socket = net.connect(this.addr, this._onConnected.bind(this));
    socket.setEncoding('binary')
    socket.on('data', this._onDataReceived.bind(this));
    socket.on('end', this._onClosed.bind(this))

    this.socket = socket
  }

  // socket event -

  _onConnected() {
    console.info('_onConnected')
    this._login(YINDL_USERNAME, YINDL_PASSWORD)
    this._init_knx()

    clearInterval(this.interval)
    this.interval = setInterval(this._heartbeat.bind(this), 60 * 1000)
  }

  _onDataReceived(data) {
    var buf = Buffer.from(data, 'binary')
    var pkg = Datagram.parse(buf)
    // console.info('Recv <--- ', buf.toString('hex'))

    if (pkg.type == Datagram.type.Heartbeat_Ack) {
      ;
    } else if (pkg.type == Datagram.type.Login_Ack) {
      console.info('Login success')
    } else if (pkg.type == Datagram.type.Init_KNX_Telegram_Reply) {
      this._onKNXUpdate(pkg.data.knx_list)

      var buf = Buffer.alloc(15)
      buf.writeUInt32BE(pkg.data.amount, 6)
      buf.writeUInt32BE(pkg.data.index, 10)
      buf.writeUInt8(pkg.data.count, 14)
      this._send(Datagram.type.Init_KNX_Telegram_Reply_Ack, buf.toString('binary'))

      if (pkg.data.index - 1 + pkg.data.count == pkg.data.amount) {
        console.info('KNX Telegrams all loaded, count: ', pkg.data.amount)
        this.emit('loaded', this.knx_dict)
      }
    } else if (pkg.type == Datagram.type.KNX_Telegram_Event) {
      this._onKNXUpdate(pkg.data.knx_list)

      var buf = Buffer.alloc(8)
      buf.writeUInt8(pkg.data.count, 7)
      this._send(Datagram.type.KNX_Telegram_Event_Ack, buf.toString('binary'))
    }
  }

  _onClosed() {
    console.info('Closed')
  }

  // -------------------------------

  _heartbeat() {
    this._send(Datagram.type.Heartbeat, '\x7b')
  }

  _login(usr, psw) {
    this._send(Datagram.type.Login, {'usr': usr, 'psw': psw})
  }

  _init_knx() {
    this.knx_dict = {}
    this._send(Datagram.type.Init_KNX_Telegram, '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00')
  }

  _onKNXUpdate(knx_telegram_list) {
    var output = `新的数据数量: ${knx_telegram_list.length}`;
    for (var i = 0; i < knx_telegram_list.length; i++) {
      var knx_telegram = knx_telegram_list[i]
      // var index = knx_telegram.charCodeAt(3)
      // this.emit('event', knx_telegram)
      // console.info('KNX  <--- ', new Buffer(knx_telegram, 'binary').toString('hex'))
      // this.knx_dict[index] = knx_telegram


      var id = knx_telegram.charCodeAt(3);
      // var value = 
      // todo 转换
      output += ` ${id}(${value})`;

      for (let i = 0; i < this.lightArray.length; i++) {
        var light = this.lightArray[i];
        if (light.Write == id || light.Read == id) {
          light.value = value
        }
      }

    }
    console.log(output);
  }

  _write(device, value) {
    var buf = Buffer.alloc(11);
    buf.writeUInt8(device.write, 3);
    buf.writeUInt8(0x0f, 4);
    buf.writeUInt8(0x04, 6);

    if (device.style === '0') {
      value = (value === 0) ? 0x0000 : 0x3f80;
      buf.writeUInt16BE(value, 7);
    } else if (device.style === '1') {
      // value (0~255) map to 0x0000 ~ 0x437f 关系不明，待转换
      buf.writeUInt16BE(value, 7);
    } else {
      // unknown
    }

    console.info(buf.toString('hex'))
    // this._send(Datagram.type.KNX_Telegram_Publish, {'knx_list': [buf]})
  }

  _knx_publish(knx_telegram_list) {
    for (var i = 0; i < knx_telegram_list.length; i++) {
      var knx_telegram = knx_telegram_list[i]
      // console.info('KNX  ---> ', new Buffer(knx_telegram, 'binary').toString('hex'))
    }
    this._send(Datagram.type.KNX_Telegram_Publish, {'knx_list': knx_telegram_list})
  }

  _send(type, data) {
    var obj = {'type': type, 'data': data}
    var pkg = Datagram.build(obj)
    // console.info('Send ---> ', pkg.toString('hex'))
    // console.info(obj)
    // '写入数据->ID=%d    DATA='
    this.socket.write(pkg)
  }

  deviceWithID(id) {
    var devices = this.lightArray.filter(value => (value.Write == id) || (value.Read == id))
    if (devices.length == 1) {
      return devices[0];
    }
    return null;
  }
}

var util = require('util');
var events = require('events');
util.inherits(YindlClient, events.EventEmitter);

module.exports = YindlClient;


// -----------------------------------

if (require.main === module) {

  (async () => {
    var projectInfoString = `
    <?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <Smarthome-Tree>
        <Light-Tree>
            <Area Name="全部" Style="0">
                <Area Name="客厅" Style="1">
                    <Light Name="射灯" Style="0" Write="5" Read="6"/>
                    <Light Name="灯带" Style="0" Write="7" Read="8"/>
                    <Light Name="烛灯" Style="0" Write="9" Read="10"/>
                    <Light Name="吊灯" Style="1" Write="11" Read="12"/>
                </Area>
                <Area Name="餐厅" Style="1">
                    <Light Name="射灯1" Style="0" Write="13" Read="14"/>
                    <Light Name="射灯2" Style="0" Write="15" Read="16"/>
                    <Light Name="吊灯" Style="1" Write="17" Read="18"/>
                </Area>
                <Area Name="玄关" Style="1">
                    <Light Name="吊灯" Style="0" Write="1" Read="2"/>
                    <Light Name="射灯" Style="0" Write="3" Read="4"/>
                </Area>
            </Area>
        </Light-Tree>
        <Blind-Tree></Blind-Tree>
        <Air-Tree></Air-Tree>
        <Underfloor-Tree></Underfloor-Tree>
        <Newfan-Tree></Newfan-Tree>
    </Smarthome-Tree>
    `;

    var projectInfo = await xml2js.parseStringPromise(projectInfoString);
    var client = new YindlClient('192.168.1.251', 60002, projectInfo);
    // console.log(client.lightArray);
    // console.log(client.deviceWithID(0x03));

    setTimeout(client.start.bind(client), 1000);
  })();

}
