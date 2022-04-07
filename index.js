var YindlClient = require('./client');

module.exports = (api) => {
  api.registerPlatform('homebridge-yindl', YindlPlatform);
}

class YindlPlatform {
  constructor(log, config, api) {
    this.accessories = []

    this.log = log
    this.config = config
    this.api = api

    api.on('didFinishLaunching', async () => {
      var client = new YindlClient(config.host, config.port)
      client.on('loaded', this.loaded.bind(this))
      client.on('event', this.event.bind(this))
      client.start()

      this.client = client
    })
  }

  loaded(knx_state) {
    var that = this

    this.config.lights.forEach(light => {
      var uuid = this.api.hap.uuid.generate(`YindlLight-${light.read}-${light.write}`)

      if (this.accessories.find(accessory => accessory.UUID === uuid)) {
        return
      }

      var service = this.api.Service.Lightbulb;

      service
        .getCharacteristic(Characteristic.On)
        .on('set', (value, callback) => { that.setPower(light, value, callback) })
        .value = (knx_state[light.read] != 0)

      if (light.style == 1) {
        service
          .getCharacteristic(Characteristic.Brightness)
          .on('set', (value, callback) => { that.setBrightness(light, value, callback) })
          .value = parseInt(knx_state[light.read] / 255 * 100)
      }

      var accessory = new this.api.platformAccessory(light.name, uuid)
      accessory.addService(service)
      accessory.reachable = true
      accessory.light = light

      this.api.registerPlatformAccessories('homebridge-yindl', 'Yindl', [accessory])
    });

  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }

  event(state) {
    for (var id in state) {
      var value = state[id]
      
      this.accessories.forEach(accessory => {
        if (accessory.light.read != id) {
          return
        }

        var service = accessory.getService(Service.Lightbulb)

        // Power
        service
          .getCharacteristic(Characteristic.On)
          .updateValue(value != 0)

        // Brightness
        if (accessory.light.style == 1) {
          service
            .getCharacteristic(Characteristic.Brightness)
            .updateValue(parseInt(value / 255 * 100))
        }

      });
    }

  }

  setPower(light, value, callback) {

    // bool -> number( 0-1 | 0-255 )
    if (value) {
      value = (light.style == 1) ? 255 : 1
    } else {
      value = 0
    }

    this.client.telegram_publish(light.write, value)
    callback()
  }

  setBrightness(light, value, callback) {
    value = parseInt(value / 100.0 * 255) // 0~100 -> 0~255
    this.client.telegram_publish(light.write, value)
    callback()
  }
}

// -----------------------------------

if (require.main === module) {

  (async () => {
    var client = new YindlClient('192.168.50.1', 60002)

    setTimeout(() => {
      client.start()
    }, 1000)

    // setTimeout(() => {
    //   client.telegram_publish(17, 255)
    // }, 5000)

  })()

}
