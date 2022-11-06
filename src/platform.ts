import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { YindlClient } from './client';
import { YindlLightbulbPlatformAccessory } from './light';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class YindlPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public client?: YindlClient;
  public lights: YindlLightbulbPlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    const { host, port } = this.config;
    if (!host || !port) {
      this.log.info('Host and port are not configured. Stop disocovering devices.');
      return;
    }

    this.client = new YindlClient(this.config.host, this.config.port, this.log);
    this.client.on('loaded', this.loaded.bind(this));
    this.client.on('event', this.event.bind(this));
    this.client.start();

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
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    });
  }

  event(state) {

    const light = this.lights.find(light => light.schema.read === state.id);
    if (!light) {
      // this.log.warn(`no accessory respondes to ${id}=${value}`);
      return;
    }

    const { accessory } = light;
    const { schema } = accessory.context;

    const service = accessory.getService(this.Service.Lightbulb);
    if (!service) {
      this.log.error(`service "Lightbulb" not found for accessory: ${accessory.displayName}`);
      return;
    }

    // Power
    this.log.info(`Update ${light.accessory.displayName} On=${light.getOn()}`);
    service.getCharacteristic(this.Characteristic.On)
      .updateValue(light.getOn());

    // Brightness
    if (schema.style === 1) {
      this.log.info(`Update ${light.accessory.displayName} Brightness=${light.getBrightness()}`);
      service.getCharacteristic(this.Characteristic.Brightness)
        .updateValue(light.getBrightness());
    }

  }

}
