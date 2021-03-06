var homebridge;
var YindlClient = require('./client');

module.exports = function (pHomebridge) {
  homebridge = pHomebridge;
  homebridge.registerPlatform('homebridge-yindl', 'Yindl', YindlPlatform, true);
};

class YindlPlatform {
  constructor(log, config, api) {
    this.log = log
    this.config = config
    this.accessories = []
    this.api = api
    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this))
  }

  didFinishLaunching() {
    var client = new YindlClient('192.168.1.251', 60002)
    client.on('loaded', this.loaded.bind(this))
    client.on('event', this.event.bind(this))
    client.start()

    this.client = client
  }

  loaded(knx_dict) {
    var that = this
    for (var i = 0; i < knx_dict.length; i++) {
      uuid = UUIDGen.generate(i)
      name = 'Yindl' + i // todo

      // knx_dict[i]

      var service = new Service.Lightbulb(name)

      service
        .getCharacteristic(Characteristic.On)
        .on('set', (value, callback) => { that.setPower(i, value, callback) })
        .value = 0

      service
        .getCharacteristic(Characteristic.Brightness)
        .on('set', (value, callback) => { that.setBrightness(i, value, callback) })
        .value = 0

      var accessory = new Accessory(name, uuid)
      accessory.addService(service, name)
      accessory.reachable = true

      this.accessories.push(accessory)
      this.api.registerPlatformAccessories('homebridge-yindl', 'Yindl', [accessory])
    }
  }

  event(knx_telegram) {
    var index = knx_telegram.charCodeAt(3)
    var accessory = this.accessories[index]
    if (accessory == null) {
      return
    }

    var service = accessory.getService(Service.Lightbulb)
    var character = service.getCharacteristic(Characteristic.On)
    character.updateValue(0)
  }

  setPower(devId, value, callback) {
    this.log.info(devId, 'setPower:', value)

    var buf = new Buffer(this.client.knx_dict[devId], 'binary')
    // buf.writeUInt16BE(value, 7)

    var knx_telegram = buf.toString('buf')
    this.client.knx_publish([knx_telegram])
    callback()
  }

  setBrightness(devId, value, callback) {
    this.log.info(devId, 'setBrightness:', value)

    var buf = new Buffer(this.client.knx_dict[devId], 'binary')
    // buf.writeUInt16BE(value, 7)

    var knx_telegram = buf.toString('buf')
    this.client.knx_publish([knx_telegram])
    callback()

  }
}

// var client = new YindlClient('192.168.1.251', 60002)
// // client.start()
// setTimeout(client.start.bind(client), 1000)

