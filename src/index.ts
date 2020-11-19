import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service
} from "homebridge";
import {Somfy} from "./lib/Somfy";

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("SomfyProtect", SomfyProtect);
};

class SomfyProtect implements AccessoryPlugin {

  private readonly logger: Logging;
  private readonly name: string;
  private readonly somfy: Somfy;
  private readonly siteId: string = "NxdSF9c2v5MxkeW5sqJCosXTTIT70xoS";
  private state: number = hap.Characteristic.SecuritySystemCurrentState.DISARMED;

  private readonly informationService: Service;
  private readonly securitySystemService: Service;

  constructor(logger: Logging, config: AccessoryConfig, api: API) {
    this.logger = logger;
    this.name = config.name;
    this.somfy = new Somfy(logger, {
      username: config.username as string,
      password: config.password as string
    });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Somfy")
      .setCharacteristic(hap.Characteristic.Model, this.name);

    this.securitySystemService = new hap.Service.SecuritySystem(this.name);
    this.securitySystemService.getCharacteristic(hap.Characteristic.SecuritySystemCurrentState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.logger.info("Current state of security system was requested, requesting somfy");

        this.somfy.getSite(this.siteId).then(result => {
          const value = somfySecurityLevelToSecuritySystemState(result?.data.security_level);
          this.logger.info("Got current state from somfy, returning: " + value);
          callback(undefined, value);
        });

        // this.logger.info("Current state of security system was requested, returning: " + this.state);
        // callback(undefined, this.state);
      });

    this.securitySystemService.getCharacteristic(hap.Characteristic.SecuritySystemTargetState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.logger.info("Target state of security system was requested, requesting somfy");

        this.somfy.getSite(this.siteId).then(result => {
          const value = somfySecurityLevelToSecuritySystemState(result?.data.security_level);
          this.logger.info("Got current state from somfy, returning: " + value);
          callback(undefined, value);
        });

        // this.logger.info("Target state of security system was requested, returning: " + this.state);
        // callback(undefined, this.state);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.logger.info("Target state was set to: " + value);
        this.state = value as number;
        callback(undefined, this.state);
        this.securitySystemService
          .getCharacteristic(hap.Characteristic.SecuritySystemCurrentState)
          .updateValue(value);
      });

    this.logger.info("Security system finished initializing!");
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return [
      this.informationService,
      this.securitySystemService
    ];
  }

}

function somfySecurityLevelToSecuritySystemState(securityLevel: string): number {
  switch (securityLevel) {
    case "armed":
      return hap.Characteristic.SecuritySystemCurrentState.AWAY_ARM;
    case "partial":
      return hap.Characteristic.SecuritySystemCurrentState.NIGHT_ARM;
    case "disarmed":
    default:
      return hap.Characteristic.SecuritySystemCurrentState.DISARMED;
  }
}