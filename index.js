var homebridge;
var YindlClient = require('./client');

module.exports = function (pHomebridge) {
  homebridge = pHomebridge;
  homebridge.registerPlatform("homebridge-yindl", "Yindl", YindlPlatform, true);
};

class YindlPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.accessories = [];
  }
}

var client = new YindlClient('192.168.1.251', 60002)
client.start()