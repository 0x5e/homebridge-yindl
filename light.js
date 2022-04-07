let PlatformAccessory;
let UUIDGen;

class YindlLightbulbAccessory extends PlatformAccessory {

  constructor(api, client, light) {
    let { Accessory, Characteristic, Service } = api.hap;
    let { name, style, write, read } = light;
    let uuid = `YindlLight-${light.read}-${light.write}`;

    super(name, uuid, Accessory.Categories.LIGHTBULB)

    this.api = api;
    this.client = client;
    this.light = light;

    // create a new Lightbulb service
    this.service = new Service(Service.Lightbulb);

    // create handlers for required characteristics
    this.service.getCharacteristic(Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    if (style == 1) {
      this.service.getCharacteristic(Characteristic.Brightness)
        .onGet(this.handleBrightnessGet.bind(this))
        .onSet(this.handleBrightnessSet.bind(this));
    }
  }

  handleOnGet() {
    return (this.client.knx_status[this.light.read] != 0);
  }

  handleOnSet(value) {
    if (value) {
      value = (this.light.style == 1) ? 255 : 1
    } else {
      value = 0
    }

    this.client.telegram_publish(this.light.write, value)
  }

  handleBrightnessGet() {
    return parseInt(this.client.knx_status[this.light.read] / 255 * 100);
  }

  handleBrightnessSet(value) {
    this.client.telegram_publish(this.light.write, value / 100 * 255);
  }
}

module.exports = YindlLightbulbAccessory;
