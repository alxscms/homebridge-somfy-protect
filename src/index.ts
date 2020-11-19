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
import {HomekitSomfySite, State} from "./lib/homekit_somfy_site";

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

  private readonly somfySite: HomekitSomfySite;

  private readonly informationService: Service;
  private readonly securitySystemService: Service;

  constructor(logger: Logging, config: AccessoryConfig, api: API) {
    this.logger = logger;
    this.name = config.name;
    this.somfySite = new HomekitSomfySite(logger, {
      username: config.username as string,
      password: config.password as string
    });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Somfy")
      .setCharacteristic(hap.Characteristic.Model, this.name);

    this.securitySystemService = new hap.Service.SecuritySystem(this.name);
    this.securitySystemService.getCharacteristic(hap.Characteristic.SecuritySystemCurrentState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        const currentState = this.somfySite.getCurrentState();
        this.logger.info("Current state of security system was requested, returning:", currentState);
        callback(undefined, currentState);
      });

    this.securitySystemService.getCharacteristic(hap.Characteristic.SecuritySystemTargetState)
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        const targetState = this.somfySite.getTargetState();
        this.logger.info("Target state of security system was requested, returning:", targetState);
        callback(undefined, targetState);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.logger.info("Target state was set to:", value);
        this.somfySite.setTargetState(value as State);
        callback(undefined, value);
      });

    this.somfySite.onCurrentStateChange(() => {
      this.securitySystemService
        .getCharacteristic(hap.Characteristic.SecuritySystemCurrentState)
        .updateValue(this.somfySite.getCurrentState());
      this.securitySystemService
        .getCharacteristic(hap.Characteristic.SecuritySystemTargetState)
        .updateValue(this.somfySite.getTargetState());
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