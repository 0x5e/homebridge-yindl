/// <reference types="node" />
import EventEmitter from 'events';
export declare class YindlClient extends EventEmitter {
    private readonly host;
    private readonly port;
    private socket?;
    private interval?;
    knx_state: {};
    constructor(host: string, port: number);
    start(): void;
    onConnected(): void;
    onDataReceived(data: any): void;
    onClosed(): void;
    heartbeat(): void;
    login(usr: any, psw: any): void;
    init_knx(): void;
    telegram_publish(id: any, value: any): void;
    send(type: any, payload: any): void;
    onKNXUpdate(knx_telegram_list: any): void;
}
//# sourceMappingURL=client.d.ts.map