import {Logging} from "homebridge";
import {SomfyAPI} from "./somfy_api";
import {EventEmitter} from "events";
import {LoggingAmount} from "./logging_amout";
import Timeout = NodeJS.Timeout;

const POLL_INTERVAL = 10000;

interface SomfySiteConfig {
  username: string;
  password: string;
  loggingAmount: LoggingAmount;
}

export enum State {
  AWAY_ARM = 1,
  NIGHT_ARM = 2,
  DISARMED = 3,
  ALARM_TRIGGERED = 4
}

export class HomekitSomfySite {

  private readonly logger: Logging;
  private readonly config: SomfySiteConfig;
  private readonly somfyAPI: SomfyAPI;
  private readonly emitter: EventEmitter;

  private siteId: string | null = null;
  private currentState: State | null = null;
  private targetState: State | null = null;
  private timeout: Timeout | null = null;

  constructor(logger: Logging, config: SomfySiteConfig) {
    this.logger = logger;
    this.config = config;

    this.somfyAPI = new SomfyAPI(logger, {
      username: config.username,
      password: config.password,
      loggingAmount: config.loggingAmount
    });

    this.emitter = new EventEmitter();

    // logging
    this.emitter.addListener("currentStateChange", () => {
      if (this.config.loggingAmount > LoggingAmount.OFF) {
        this.logger.info(`Current state changed: currentState=${this.currentState}, targetState=${this.targetState}`);
      }
    });

    this.initialize().then(this.startPolling.bind(this));
  }

  private async initialize() {
    const result = await this.somfyAPI.getALLSites();
    const site = result?.data?.items[0];
    if (site) {
      // set site id
      this.siteId = site.site_id;
      // set current state
      if (site.security_level) {
        const currentState = somfySecurityLevelToHomekitState(site.security_level);
        this.currentState = currentState;
        this.targetState = currentState;
      }
    }
  }

  isInitialized(): boolean {
    return this.siteId !== null && this.currentState !== null && this.targetState !== null;
  }

  private async poll() {
    if (this.siteId !== null) {
      const result = await this.somfyAPI.getSite(this.siteId);
      const security_level = result?.data?.security_level;
      if (security_level) {
        // logging
        if (this.config.loggingAmount === LoggingAmount.FULL) {
          this.logger.info("Poll security level with success, getting:", security_level);
        }
        const state = somfySecurityLevelToHomekitState(security_level);
        this.setCurrentState(state);
      }
    } else {
      throw "Can't poll: HomekitSomfySite has not been properly initialized.";
    }
  }

  private async startPolling() {
    if (this.timeout === null) {
      this.poll();
      this.timeout = setInterval(this.poll.bind(this), POLL_INTERVAL);
    } else {
      // logging
      if (this.config.loggingAmount === LoggingAmount.FULL) {
        this.logger.info("startPolling: Polling already started");
      }
    }
  }

  private stopPolling() {
    if (this.timeout !== null) {
      clearInterval(this.timeout);
      this.timeout = null;
    } else {
      // logging
      if (this.config.loggingAmount === LoggingAmount.FULL) {
        this.logger.info("stopPolling: Polling already stopped");
      }
    }
  }

  getCurrentState(): State {
    if (this.currentState) {
      return this.currentState;
    } else {
      throw "getCurrentState: HomekitSomfySite not properly initialized";
    }
  }

  private setCurrentState(state: State) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.targetState = state; // needed when external changes are occurring
      this.emitter.emit("currentStateChange");
    }
  }

  getTargetState(): State {
    if (this.targetState) {
      return this.targetState;
    } else {
      throw "getTargetState: HomekitSomfySite not properly initialized";
    }
  }

  setTargetState(state: State) {
    this.stopPolling();
    this.targetState = state;
    if (this.siteId !== null) {
      // logging
      if (this.config.loggingAmount === LoggingAmount.FULL) {
        this.logger.info("setTargetState", state);
      }
      this.somfyAPI.setSecurityLevel(this.siteId, homekitStateToSomfySecurityLevel(state))
        .then(() => setTimeout(this.startPolling.bind(this), 1000))
        .catch(this.startPolling.bind(this));
    }
  }

  onCurrentStateChange(callback: () => void) {
    this.emitter.addListener("currentStateChange", callback);
  }

  offCurrentStateChange(callback: () => void) {
    this.emitter.removeListener("currentStateChange", callback);
  }

}

function somfySecurityLevelToHomekitState(securityLevel: "disarmed" | "armed" | "partial"): State {
  switch (securityLevel) {
    case "armed":
      return State.AWAY_ARM;
    case "partial":
      return State.NIGHT_ARM;
    case "disarmed":
      return State.DISARMED;
  }
}

function homekitStateToSomfySecurityLevel(state: State): "disarmed" | "armed" | "partial" {
  switch (state) {
    case State.AWAY_ARM:
      return "armed";
    case State.NIGHT_ARM:
      return "partial";
    case State.DISARMED:
      return "disarmed";
    default:
      throw "Unknown security level for " + state;
  }
}