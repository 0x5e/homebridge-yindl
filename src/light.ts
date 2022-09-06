import { Service, PlatformAccessory, CharacteristicValue, DynamicPlatformPlugin } from 'homebridge';

import { YindlPlatform } from './platform';

export class YindlLightbulbPlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: YindlPlatform,
    public readonly accessory: PlatformAccessory,
  ) {

    this.service = accessory.getService(platform.Service.Lightbulb) || accessory.addService(platform.Service.Lightbulb);

    this.service.setCharacteristic(platform.Characteristic.Name, this.schema.name);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getOn.bind(this))
      .onSet(this.setOn.bind(this));

    if (this.schema.style == 1) {
      this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onGet(this.getBrightness.bind(this))
        .onSet(this.setBrightness.bind(this));
    }

  }

  get schema() {
    return this.accessory.context.schema;
  }

  getOn() {
    return (this.platform.client.knx_state[this.schema.read] != 0);
  }

  setOn(value) {
    if (value) {
      value = (this.schema.style == 1) ? 255 : 1
    } else {
      value = 0
    }

    this.platform.client.telegram_publish(this.schema.write, value);
  }

  getBrightness() {
    // TODO: parseInt
    return this.platform.client.knx_state[this.schema.read] / 255 * 100;
  }

  setBrightness(value) {
    value = value / 100 * 255;
    this.platform.client.telegram_publish(this.schema.write, value);
  }
}
