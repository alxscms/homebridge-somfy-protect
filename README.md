
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

Unofficial [Homebridge](https://github.com/homebridge/homebridge) plugin to integrate the Somfy Protect home security system with HomeKit.

## Usage

Configure the plugin in your Homebridge `config.json` file or via the popular [Config UI X plugin](https://github.com/oznu/homebridge-config-ui-x) which I recommend for easiest usage.

Either install and configure the plugin using Config UI X or install it manually by running the following command:

```
npm install -g homebridge-somfy-protect
```

Then, add the following configuration to the `accessories` array in your Homebridge `config.json`.

```
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "my.somfy@account.fr",
  "password": "my.somfy.account.password"
}

```

The credentials required in the configuration are the same ones you use in the official Somfy Protect app on your smartphone.

That's it! The plugin will automatically add your Somfy Protect alarm in your homekit accessories.

## Known limitations

Having multiple homes set up in your Somfy Protect app is not supported yet as the plugin will choose one home arbitrarily. If this is something you need don't hesitate to post in the issues and I will see what I can do.

## Help & Support
Any feedback is welcome. For bugs, feature requests, open an issue here :)
