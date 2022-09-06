import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import YindlClient from './client';
import { YindlLightbulbPlatformAccessory } from './light';

export class YindlPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  public client: YindlClient;
  public lights: YindlLightbulbPlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    api.on('didFinishLaunching', async () => {
      this.client = new YindlClient(config.host, config.port);
      this.client.on('loaded', this.loaded.bind(this));
      this.client.on('event', this.event.bind(this));
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

        const light = new YindlLightbulbPlatformAccessory(this, existingAccessory, this.client);
        this.lights.push(light);

      } else {
        const accessory = new this.api.platformAccessory(schema.name, uuid);
        accessory.context.schema = schema;

        const light = new YindlLightbulbPlatformAccessory(this, accessory, this.client);
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
          .updateValue(light.getOn())

        // Brightness
        if (schema.style == 1) {
          service
            .getCharacteristic(this.Characteristic.Brightness)
            .updateValue(light.getBrightness())
        }

      });
    }

  }

}
