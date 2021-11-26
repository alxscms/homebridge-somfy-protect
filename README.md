
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

If your somfy account has multiple homes set up, you can specify which home the plugin should be using in the config by specifying the `siteId` attribute. You should see the list of available homes in the plugin logs (even if you have turned off logs). Your config should now look like this:

```
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "my.somfy@account.fr",
  "password": "my.somfy.account.password",
  "siteId": "yoursiteid"
}
```

## Help & Support
Any feedback is welcome. For bugs, feature requests, open an issue here :)

## Dev
Use command `npm run watch` to start a homebridge server when developing the plugin. Config used by the plugin should be set up in the folder `~/.homebridge`.
