# homebridge-yindl

[![homebridge-yindl](https://badgen.net/npm/v/homebridge-yindl?icon=npm)](https://www.npmjs.com/package/homebridge-yindl)
[![mit-license](https://badgen.net/github/license/0x5e/homebridge-yindl)](https://github.com/merdok/homebridge-yindl/blob/master/LICENSE)

`homebridge-yindl` is a plugin for homebridge which allows you to control devices from Yindl KNX Gateway.

## Supported device types

- Light

## To be supported

- Air Conditioner
- Curtain
- Floor Heating

## Installation

If you are new to homebridge, please first read the homebridge [documentation](https://github.com/homebridge/homebridge#readme). If you are running on a Raspberry, you will find a tutorial in the [homebridge wiki](https://github.com/homebridge/homebridge/wiki/Install-Homebridge-on-Raspbian).

Install homebridge:
```shell
sudo npm install -g homebridge
```

Install homebridge-yindl:
```shell
sudo npm install -g homebridge-yindl
```

## Configuration

Add the `YindlPlatform` platform in `config.json` in your home directory inside `.homebridge`.

Add your lights in the `lights` array.

Example configuration:

```json
{
  "platforms": [
    {
      "host": "192.168.1.251",
      "port": 60002,
      "lights": [
        {
          "name": "Living Room Light Strip",
          "style": 0,
          "write": 1,
          "read": 2
        },
        {
          "name": "Living Room Ceiling Light",
          "style": 1,
          "write": 3,
          "read": 4
        }
      ],
      "platform": "YindlPlatform"
    },
  ]
}
```

## Platform configuration fields

- `platform` \[required\] Must always be **"YindlPlatform"**.
- `hosts` \[required\] the Gateway IP address. **Default: "192.168.1.251"**.
- `port` \[required\] the Gateway IP port. **Default: "60002"**.
- `lights` \[optional\] A list of your lights.

## light configuration fields

- `name` \[required\] Name of the light.
- `style` \[required\] Type of the light. `1` means brightness supported, `0` means not supported.
- `write` \[required\] Write ID of the light.
- `read` \[required\] Read ID of the light.
