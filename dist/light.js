"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YindlLightbulbPlatformAccessory = void 0;
class YindlLightbulbPlatformAccessory {
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Yindl')
            .setCharacteristic(this.platform.Characteristic.Model, 'YindlLightbulb')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, '');
        this.service = accessory.getService(platform.Service.Lightbulb) || accessory.addService(platform.Service.Lightbulb);
        this.service.setCharacteristic(platform.Characteristic.Name, this.schema.name);
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.getOn.bind(this))
            .onSet(this.setOn.bind(this));
        if (this.schema.style === 1) {
            this.service.getCharacteristic(this.platform.Characteristic.Brightness)
                .onGet(this.getBrightness.bind(this))
                .onSet(this.setBrightness.bind(this));
        }
    }
    get schema() {
        return this.accessory.context.schema;
    }
    getOn() {
        return (this.platform.client.knx_state[this.schema.read] !== 0);
    }
    setOn(value) {
        if (value) {
            value = (this.schema.style === 1) ? 255 : 1;
        }
        else {
            value = 0;
        }
        this.platform.client.telegram_publish(this.schema.write, value);
    }
    getBrightness() {
        return parseInt((this.platform.client.knx_state[this.schema.read] / 255 * 100).toFixed(0));
    }
    setBrightness(value) {
        value = value / 100 * 255;
        this.platform.client.telegram_publish(this.schema.write, value);
    }
}
exports.YindlLightbulbPlatformAccessory = YindlLightbulbPlatformAccessory;
//# sourceMappingURL=light.js.map