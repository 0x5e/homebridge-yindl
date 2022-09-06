import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { YindlClient } from './client';
import { YindlLightbulbPlatformAccessory } from './light';
export declare class YindlPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: PlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    client: YindlClient;
    lights: YindlLightbulbPlatformAccessory[];
    constructor(log: Logger, config: PlatformConfig, api: API);
    configureAccessory(accessory: any): void;
    loaded(): void;
    event(state: any): void;
}
//# sourceMappingURL=platform.d.ts.map