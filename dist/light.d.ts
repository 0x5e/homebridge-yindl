import { PlatformAccessory } from 'homebridge';
import YindlClient from './client';
import { YindlPlatform } from './platform';
export declare class YindlLightbulbPlatformAccessory {
    private readonly platform;
    readonly accessory: PlatformAccessory;
    private readonly client;
    private service;
    constructor(platform: YindlPlatform, accessory: PlatformAccessory, client: YindlClient);
    get schema(): any;
    getOn(): boolean;
    setOn(value: any): void;
    getBrightness(): number;
    setBrightness(value: any): void;
}
//# sourceMappingURL=light.d.ts.map