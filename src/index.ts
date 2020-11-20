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
import {LoggingAmount} from "./lib/logging_amout";

let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory("SomfyProtect", SomfyProtect);
};

class SomfyProtect implements AccessoryPlugin {

  private readonly VALID_CURRENT_STATE_VALUES = [
    hap.Characteristic.SecuritySystemCurrentState.NIGHT_ARM,
    hap.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
    hap.Characteristic.SecuritySystemCurrentState.DISARMED,
    hap.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED
  ];

  private readonly VALID_TARGET_STATE_VALUES = [
    hap.Characteristic.SecuritySystemTargetState.NIGHT_ARM,
    hap.Characteristic.SecuritySystemTargetState.AWAY_ARM,
    hap.Characteristic.SecuritySystemTargetState.DISARM
  ];

  private readonly logger: Logging;
  private readonly name: string;
  private readonly loggingAmount: LoggingAmount;

  private readonly somfySite: HomekitSomfySite;

  private readonly informationService: Service;
  private readonly securitySystemService: Service;

  constructor(logger: Logging, config: AccessoryConfig) {
    this.logger = logger;
    this.name = config.name;
    this.loggingAmount = config.loggingAmount as LoggingAmount;

    this.somfySite = new HomekitSomfySite(logger, {
      username: config.username as string,
      password: config.password as string,
      loggingAmount: this.loggingAmount
    });

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, "Somfy")
      .setCharacteristic(hap.Characteristic.Model, this.name);

    this.securitySystemService = new hap.Service.SecuritySystem(this.name);
    this.securitySystemService.getCharacteristic(hap.Characteristic.SecuritySystemCurrentState)
      .setProps({validValues: this.VALID_CURRENT_STATE_VALUES})
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        if (this.somfySite.isInitialized()) {
          const currentState = this.somfySite.getCurrentState();
          // logging
          if (this.loggingAmount > LoggingAmount.OFF) {
            this.logger.info("Current state of security system was requested, returning:", currentState);
          }
          callback(null, currentState);
        } else {
          callback(new Error("An error occurred while getting the current security system state"));
        }
      });

    this.securitySystemService.getCharacteristic(hap.Characteristic.SecuritySystemTargetState)
      .setProps({validValues: this.VALID_TARGET_STATE_VALUES})
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        if (this.somfySite.isInitialized()) {
          const targetState = this.somfySite.getTargetState();
          // logging
          if (this.loggingAmount > LoggingAmount.OFF) {
            this.logger.info("Target state of security system was requested, returning:", targetState);
          }
          callback(null, targetState);
        } else {
          callback(new Error("An error occurred while getting the target security system state"));
        }

      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        // logging
        if (this.loggingAmount > LoggingAmount.OFF) {
          this.logger.info("Target state was set to:", value);
        }
        this.somfySite.setTargetState(value as State);
        callback(null, value);
      });

    this.somfySite.onCurrentStateChange(() => {
      this.securitySystemService.updateCharacteristic(hap.Characteristic.SecuritySystemCurrentState, this.somfySite.getCurrentState());
      this.securitySystemService.updateCharacteristic(hap.Characteristic.SecuritySystemTargetState, this.somfySite.getTargetState());
    });

    // logging
    if (this.loggingAmount > LoggingAmount.OFF) {
      this.logger.info("Security system finished initializing!");
    }

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