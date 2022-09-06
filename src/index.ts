import { API } from 'homebridge';

import { YindlPlatform } from './platform';

export = (api: API) => {
  api.registerPlatform('YindlPlatform', YindlPlatform);
};
