Unofficial [Homebridge](https://github.com/homebridge/homebridge) plugin to integrate the Somfy Protect home security system with HomeKit.

This plugin is compatible with the official [Config UI X plugin](https://github.com/oznu/homebridge-config-ui-x) which I recommend for easiest usage.



## Features
Supercharge your SimpliSafe system and integrate with HomeKit the right way!
This plugin supports:
- **Real time event streaming:** get immediate notifications anytime the alarm is armed / disarmed / triggered.
- **Sensors:** always be on top of your home with immediate access to the sensor status. Create smart automations directly from the Home app (e.g. when the front door is opened, turn the lights on).
- **Cameras:** view your SimpliCams directly from the Home app, receive doorbell notifications and motion snapshots.
- **Battery monitoring:** the Home app will notify you if the battery level of one of your sensors is low.

Here are some example screenshots:

<img alt="Sensors" src="https://raw.githubusercontent.com/nzapponi/homebridge-simplisafe3/master/docs/sensors.png" width="50%"><img alt="Alarm controls" src="https://raw.githubusercontent.com/nzapponi/homebridge-simplisafe3/master/docs/arm.png" width="50%">

## Usage

This plugin supports installation and changing settings (for `config.js`) via the popular [Config UI X plugin](https://github.com/oznu/homebridge-config-ui-x) (recommended for easiest usage).

Ensure you are running Node v10.17.0 or higher (this version is required by Homebridge v1.0.0). You can check by using `node -v`.

Either install and configure using Config UI X or you can manually install the plugin by running:

```
npm install -g --unsafe-perm homebridge-simplisafe3
```

Then, add the following configuration to the `platforms` array in your Homebridge `config.json`.


```
{
    "platform": "homebridge-simplisafe3.SimpliSafe 3",
    "name": "Home Alarm",
    "auth": {
        "username": "YOUR_USERNAME",
        "password": "YOUR_PASSWORD"
    }
}
```

That's it! The plugin will automatically load all your sensors into Homebridge.

### Optional Parameters

#### `cameras` and `cameraOptions`
These enable camera support. See [Camera Support](#camera-support) for more details.

#### `debug`
Type: boolean (default `false`)

Switch this on to get more details about your sensors and plugin behavior in your Homebridge logs. This can be useful if you are having trouble or need to report an issue. To see all messages the [Homebridge debug (`-D`) option must also be enabled](https://github.com/homebridge/homebridge-raspbian-image/wiki/How-To-Enable-Debug-or-Insecure-Mode).

#### `subscriptionId`
Type: string

Add this parameter in case you have multiple protected locations or accounts with SimpliSafe. The `subscriptionId` can be found at the bottom of your base unit.

#### `sensorRefresh`
Type: integer (default `15` seconds)

The frequency with which the plugin will poll sensors (e.g. Entry sensors), since entry sensor changes (opening/closing) are not pushed from SimpliSafe. Warning: setting this value too low will likely lead to your IP address being (temporarily) blocked by SimpliSafe.

#### `persistAccessories`
Type: boolean (default `false`)

By default, the plugin will remove old accessories that no longer exist in SimpliSafe from the Home app. If you are running into issues with your accessories randomly disappearing from Home, and you don't want to remove old accessories, set this to `true`.

#### `resetSimpliSafeId`
Type: boolean (default `false`)

Upon first start, the plugin generates an ID which it uses to identify itself with SimpliSafe. If you wish to reset it, set this to `true`.

### Supported Devices

Device             | Supported          | Notes
------------------ | ------------------ | -------------------------------------------------
Alarm arm/disarm   | :white_check_mark: | Home, away and off modes
SimpliCam          | :white_check_mark: | Audio, video, motion*, no microphone
Doorbell           | :white_check_mark: | Audio, video, motion, no microphone
Smart lock         | :white_check_mark: |
Entry sensor       | :white_check_mark: |
Smoke detector     | :white_check_mark: | Includes support for tamper & fault
CO detector        | :white_check_mark: | Includes support for tamper & fault
Water sensor       | :white_check_mark: |
Freeze sensor      | :white_check_mark: | Supports temperature readings, not sensor trigger
Motion sensor      | :white_check_mark: | Requires motion sensor set to "Secret Alert" or "Alarm" in SimpliSafe settings**
Glassbreak sensor  | :x:                | State not provided by SimpliSafe
Keypad             | :x:                | State not provided by SimpliSafe
Panic button       | :x:                | State not provided by SimpliSafe

\* SimpliCams provide motion notifications only if the privacy shutter is open.

\** The default SimpliSafe settings for motion sensors are "Disabled" when alarm is "Off" or "Home", in which case motion events will not be accurate since they won't always trigger. For consistency of the Home app, motion sensors need to be switched to either "Secret Alert" or "Alarm" in **every** alarm mode for the sensors to appear in the app.
For example, setting the motion sensor to Secret Alert in Off and Home mode and Alarm in Away mode **will** display it in the Home app, whereas setting it to Disabled in Off mode, Secret Alert in Home mode and Alarm in Away mode **won't**, since the sensor state and automations in the Home app would be inaccurate.
Using the "Secret Alert" setting will allow for motion events at all times but note that [this will also record a video clip](https://simplisafe.com/forum/customer-support-forum/installing-and-using-simplisafe/secret-alert-triggers-camera) when motion events are triggered.

All devices also support low battery warnings.

### Camera Support
To enable camera support, simply switch `"cameras": true` in your `config.json` (or set via Config UI X admin).

**As of version v1.5.0 (which requires Homebridge v1.0.0 or later) cameras do not need to be added separately. Bridged cameras in v1.5.0 or later will not function properly with versions of Homebridge below 1.0.0. See [Migrating External Cameras to Bridged Cameras](#migrating-external-cameras-to-bridged-cameras) below.**

#### Migrating External Cameras to Bridged Cameras
After upgrading to v1.5.0, old (external) cameras will cease to function. This also means any existing HomeKit automations containing the camera will need to be updated. We recommend the following steps to avoid losing automations:

1. After updating the plugin you will see your new cameras automatically, if you are unsure which is which, click **Edit** on the camera in the Home app to view its settings and at the bottom you will see a button to **Remove Camera From Home** under an *old* external camera whereas new ones will show a link to the Bridge (and no remove button).
1. Before removing the old camera, update any automations that you have to replace any relevant parts with the new camera.
1. You can now safely remove your old camera from the Home app.

#### Camera Options
This plugin includes [ffmpeg-for-homebridge](https://github.com/homebridge/ffmpeg-for-homebridge) to automatically include a compatible build of ffmpeg and thus the plugin works "out of the box" without requiring a custom ffmpeg build.

For advanced scenarios including specifying a custom ffmpeg build or command line arguments, you can set them via plugin settings in Config UI X or manually in `config.json`\*:

```
"cameraOptions": {
    "ffmpegPath": "/path/to/custom/ffmpeg",
    "sourceOptions": "-format: flv ... (any other ffmpeg argument)",
    "videoOptions": "-vcodec h264_omx -tune false ... (any other ffmpeg argument)",
    "audioOptions": "-ar 256k ... (any other ffmpeg argument)"
}
```
\* *Note that the format of `"cameraOptions"` changed as of v1.4.3. Old config files should continue work but your settings may need to be re-entered if you are switching to using Config UI X*

Any arguments provided in `sourceOptions`, `videoOptions` and `audioOptions` will be added to the list of arguments passed to ffmpeg, or will replace the default ones if these already exist.
To add an argument that requires no additional parameter, e.g. `-re`, then add it as `"-re"`.
To remove a default argument, define it with `false` as its value, e.g. `"-tune false"`.

#### FFMPEG Hardware Acceleration
 The bundled build of ffmpeg *includes* hardware acceleration on supported Raspberry Pi models but in order to enable this you must check the setting **Advanced Camera Settings** > **Enable Hardware Acceleration for Raspberry Pi** (or set `"enableHwaccelRpi"` under `"cameraOptions"` to `true` in `config.json`).

*Note that enabling this option assumes you are using the bundled version of ffmpeg and thus may not work if you specify a custom one.*

## Known Issues
- If you are running Homebridge [oznu/docker-homebridge](https://github.com/oznu/docker-homebridge) camera streaming is limited to 720px wide.
- Due to transcoding requirements, when using a Raspberry Pi 3b video feeds will disconnect after ~20 seconds. RPi 4 or newer is recommended. See [issue #147](https://github.com/nzapponi/homebridge-simplisafe3/issues/147)

## Help & Support
Any feedback is welcomed. For bugs, feature requests, etc. you may open an issue here.

The official [Homebridge Discord server](https://discord.gg/kqNCe2D) and [Reddit community](https://www.reddit.com/r/homebridge/) are another great place to ask for help.