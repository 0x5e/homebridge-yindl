import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { YindlPlatform } from './platform';
export declare class YindlLightbulbPlatformAccessory {
    private readonly platform;
    readonly accessory: PlatformAccessory;
    private service;
    constructor(platform: YindlPlatform, accessory: PlatformAccessory);
    get schema(): any;
    getOn(): boolean;
    setOn(value: CharacteristicValue): void;
    getBrightness(): number;
    setBrightness(value: CharacteristicValue): void;
}
//# sourceMappingURL=light.d.ts.map