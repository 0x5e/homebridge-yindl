var YindlClient = require('./client');

module.exports = (api) => {
  api.registerPlatform('homebridge-yindl', YindlPlatform);
}

class YindlPlatform {
  constructor(log, config, api) {
    this.accessories = []
    this.api = api

    api.on('didFinishLaunching', async () => {

      var host = config['host']
      var port = config['port']
      var projectInfoString = config['projectInfoString']
      var projectInfo = await xml2js.parseStringPromise(projectInfoString)

      var client = new YindlClient(host, port, projectInfo)
      client.on('loaded', this.loaded.bind(this))
      client.on('event', this.event.bind(this))
      client.start()

      this.client = client
    })
  }

  loaded(knx_dict) {
    var that = this

    this.lightArray.forEach(light => {
      var uuid = `YindlLight-${light.Read}`
      var name = light.Name

      if (this.accessories.find(accessory => accessory.UUID === uuid)) {
        return
      }

      var service = new Service.Lightbulb(name)

      service
        .getCharacteristic(Characteristic.On)
        .on('set', (value, callback) => { that.setPower(light, value, callback) })
        .value = 0

      if (light.Style == 1) {
        service
          .getCharacteristic(Characteristic.Brightness)
          .on('set', (value, callback) => { that.setBrightness(light, value, callback) })
          .value = 0
      }

      var accessory = new this.api.platformAccessory(name, uuid)
      accessory.addService(service, name)
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
        if (accessory.light.Read != id) {
          return
        }

        var service = accessory.getService(Service.Lightbulb)

        // Power
        service
          .getCharacteristic(Characteristic.On)
          .updateValue(value != 0)

        // Brightness
        if (accessory.light.Style == 1) {
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
      value = (light.Style == 1) ? 255 : 1
    } else {
      value = 0
    }

    this.client.telegram_publish(light.Write, value)
    callback()
  }

  setBrightness(light, value, callback) {
    value = parseInt(value / 100.0 * 255) // 0~100 -> 0~255
    this.client.telegram_publish(light.Write, value)
    callback()
  }
}

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
    `

    var client = new YindlClient('192.168.50.1', 60002, projectInfoString)

    setTimeout(() => {
      client.start()
    }, 1000)

    // setTimeout(() => {
    //   client.telegram_publish(17, 255)
    // }, 5000)

  })()

}
