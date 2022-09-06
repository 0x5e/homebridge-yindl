"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YindlPlatform = void 0;
const client_1 = require("./client");
const light_1 = require("./light");
class YindlPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.accessories = [];
        this.lights = [];
        this.log.debug('Finished initializing platform:', this.config.name);
        this.client = new client_1.YindlClient(config.host, config.port);
        this.client.on('loaded', this.loaded.bind(this));
        this.client.on('event', this.event.bind(this));
        api.on('didFinishLaunching', async () => {
            this.client.start();
        });
    }
    configureAccessory(accessory) {
        this.accessories.push(accessory);
    }
    loaded() {
        this.config.lights.forEach(schema => {
            const uuid = this.api.hap.uuid.generate(`YindlLightbulb-${schema.read}-${schema.write}`);
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                const light = new light_1.YindlLightbulbPlatformAccessory(this, existingAccessory);
                this.lights.push(light);
            }
            else {
                const accessory = new this.api.platformAccessory(schema.name, uuid);
                accessory.context.schema = schema;
                const light = new light_1.YindlLightbulbPlatformAccessory(this, accessory);
                this.lights.push(light);
                this.log.info('Adding new accessory:', accessory.displayName);
                this.api.registerPlatformAccessories('homebridge-yindl', 'YindlPlatform', [accessory]);
            }
        });
    }
    event(state) {
        for (var id in state) {
            this.lights.forEach(light => {
                const { accessory } = light;
                const { schema } = accessory.context;
                if (!schema || schema.read != id) {
                    return;
                }
                var service = accessory.getService(this.Service.Lightbulb);
                if (!service) {
                    this.log.error(`service "Lightbulb" not found for accessory: ${accessory.displayName}`);
                    return;
                }
                // Power
                service
                    .getCharacteristic(this.Characteristic.On)
                    .updateValue(light.getOn());
                // Brightness
                if (schema.style == 1) {
                    service
                        .getCharacteristic(this.Characteristic.Brightness)
                        .updateValue(light.getBrightness());
                }
            });
        }
    }
}
exports.YindlPlatform = YindlPlatform;
//# sourceMappingURL=platform.js.map