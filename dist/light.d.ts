import { PlatformAccessory } from 'homebridge';
import { YindlPlatform } from './platform';
export declare class YindlLightbulbPlatformAccessory {
    private readonly platform;
    readonly accessory: PlatformAccessory;
    private service;
    constructor(platform: YindlPlatform, accessory: PlatformAccessory);
    get schema(): any;
    getOn(): boolean;
    setOn(value: any): void;
    getBrightness(): number;
    setBrightness(value: any): void;
}
//# sourceMappingURL=light.d.ts.map