
class YindlLightbulb {

  constructor(api, client, light) {
    this.api = api;
    this.client = client;
    this.light = light;

    let { platformAccessory } = api;
    let { Accessory, Characteristic, Service, uuid } = api.hap;
    let { name, style, write, read } = light;

    // create a new Lightbulb service
    let service = new Service.Lightbulb();

    // create handlers for required characteristics
    service.getCharacteristic(Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    if (style == 1) {
      service.getCharacteristic(Characteristic.Brightness)
        .onGet(this.handleBrightnessGet.bind(this))
        .onSet(this.handleBrightnessSet.bind(this));
    }

    this.accessory = new platformAccessory(name, uuid.generate(`YindlLight-${light.read}-${light.write}`), Accessory.Categories.LIGHTBULB)
    this.accessory.addService(service)
    this.accessory.controller = this

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

module.exports = YindlLightbulb;
