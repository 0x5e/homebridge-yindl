import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { YindlClient } from './client';
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

    this.client = new YindlClient(config.host, config.port);
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

        const light = new YindlLightbulbPlatformAccessory(this, existingAccessory);
        this.lights.push(light);

      } else {
        const accessory = new this.api.platformAccessory(schema.name, uuid);
        accessory.context.schema = schema;

        const light = new YindlLightbulbPlatformAccessory(this, accessory);
        this.lights.push(light);

        this.log.info('Adding new accessory:', accessory.displayName);
        this.api.registerPlatformAccessories('homebridge-yindl', 'YindlPlatform', [accessory]);
      }
    });
  }

  event(state) {
    const { id, value } = state;
    this.log.info(`event ${state}`);

    const light = this.lights.find(light => light.schema.read == id);
    if (!light) {
      this.log.warn(`no accessory respondes to ${state}`);
      return;
    }

    const { accessory } = light;
    const { schema } = accessory.context;

    var service = accessory.getService(this.Service.Lightbulb);
    if (!service) {
      this.log.error(`service "Lightbulb" not found for accessory: ${accessory.displayName}`);
      return;
    }

    // Power
    this.log.info(`Update ${light.accessory.displayName} On=${light.getOn()}`);
    service
      .getCharacteristic(this.Characteristic.On)
      .updateValue(light.getOn())

    // Brightness
    if (schema.style === 1) {
      this.log.info(`Update ${light.accessory.displayName} Brightness=${light.getBrightness()}`);
      service
        .getCharacteristic(this.Characteristic.Brightness)
        .updateValue(light.getBrightness())
    }

  }

}
