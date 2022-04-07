var YindlClient = require('./client');
var YindlLightbulbAccessory = require('./light');

var Accessory, Service, Characteristic;

module.exports = (api) => {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerPlatform('homebridge-yindl', 'YindlPlatform', YindlPlatform, true);
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

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }

  loaded() {
    this.config.lights.forEach(light => {
      var accessory = new YindlLightbulbAccessory(api, client, light)
      accessory.reachable = true
      this.api.registerPlatformAccessories('homebridge-yindl', 'YindlPlatform', [accessory])
    });
  }

  event(state) {
    for (var id in state) {
      var value = state[id]
      
      this.accessories.forEach(accessory => {
        if (accessory instanceof YindlLightbulbAccessory) {
          if (accessory.light.read != id) {
            return
          }

          var service = accessory.getService(Service.Lightbulb)

          // Power
          service
            .getCharacteristic(Characteristic.On)
            .updateValue(accessory.handleOnGet())

          // Brightness
          if (accessory.light.style == 1) {
            service
              .getCharacteristic(Characteristic.Brightness)
              .updateValue(accessory.handleBrightnessGet())
          }
        }

      });
    }

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
