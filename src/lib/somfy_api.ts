// import {readFileSync, writeFileSync} from "fs";
import axios from "axios";
import {Logging} from "homebridge";
import {LoggingAmount} from "./logging_amout";

const CLIENT_ID = "84eddf48-2b8e-11e5-b2a5-124cfab25595_475buqrf8v8kgwoo4gow08gkkc0ck80488wo44s8o48sg84k40";
const CLIENT_SECRET = "4dsqfntieu0wckwwo40kw848gw4o0c8k4owc80k4go0cs0k844";

interface SomfyAPIConfig {
  username: string;
  password: string;
  loggingAmount: LoggingAmount;
}

export class SomfyAPI {

  private logger: Logging;
  private config: SomfyAPIConfig;
  private baseUrl = "https://api.myfox.io/v3";
  private token: any;

  constructor(logger: Logging, config: SomfyAPIConfig) {
    this.logger = logger;
    this.config = config;

    axios.interceptors.request.use(config => {
      config.headers["request-startTime"] = process.hrtime();
      config.headers["Content-Type"] = "application/json";
      config.headers["Accept-Encoding"] = "gzip";
      return config;
    });

    axios.interceptors.response.use(response => {
      const start = response.config.headers["request-startTime"];
      const end = process.hrtime(start);
      const duration = Math.round((end[0] * 1000) + (end[1] / 1000000));
      // logging
      if (this.config.loggingAmount === LoggingAmount.FULL) {
        this.logger.info(`${response.config.url} : ${duration} ms`);
      }
      response.headers["request-duration"] = duration;
      return response;
    });
  }

  private async getNewToken() {
    // logging
    if (this.config.loggingAmount === LoggingAmount.FULL) {
      this.logger.info("Getting a new token");
    }
    const token = await axios.post("https://sso.myfox.io/oauth/oauth/v2/token", {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username: this.config.username,
      password: this.config.password,
      grant_type: "password"
    });
    this.token = token.data;
    this.token.issuance = new Date().getTime();
    return this.token;
  }

  private async getRefreshToken(refreshToken: string) {
    // logging
    if (this.config.loggingAmount === LoggingAmount.FULL) {
      this.logger.info("Refreshing token");
    }
    const token = await axios.post("https://sso.myfox.io/oauth/oauth/v2/token", {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    });
    this.token = token.data;
    this.token.issuance = new Date().getTime();
    return this.token;
  }

  private hasExpired() {
    return this.token.issuance + this.token.expires_in - 1000 < new Date().getTime();
  }

  async updateToken() {
    if (!!this.token && !this.hasExpired()) {
      return this.token;
    } else if (this.token) {
      try {
        this.token = await this.getRefreshToken(this.token.refresh_token);
        return this.token;
      } catch (error) {
        this.logger.error(error.message);
        this.logger.error("Need authorization request!");
        return error.message;
      }
    } else {
      try {
        this.token = this.getNewToken();
        return this.token;
      } catch (e) {
        this.logger.error(e);
        this.logger.error(e.message);
        this.logger.error("Need authorization request!");
      }
    }
  }

  async getALLSites() {
    const token = await this.updateToken();
    const options = {headers: {"Authorization": `Bearer ${token.access_token}`}};
    try {
      return await axios.get(`${this.baseUrl}/site`, options);
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async getSite(siteId: string) {
    const token = await this.updateToken();
    const options = {headers: {"Authorization": `Bearer ${token.access_token}`}};
    try {
      return await axios.get(`${this.baseUrl}/site/${siteId}`, options);
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async getDevicesFromSiteId(siteId: string) {
    const token = await this.updateToken();
    const options = {headers: {"Authorization": `Bearer ${token.access_token}`}};
    try {
      return await axios.get(`${this.baseUrl}/site/${siteId}/device`, options);
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async getDevice(siteId: string, deviceId: string) {
    const token = await this.updateToken();
    const options = {headers: {"Authorization": `Bearer ${token.access_token}`}};
    try {
      return await axios.get(`${this.baseUrl}/site/${siteId}/device/${deviceId}`, options);
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  async setSecurityLevel(siteId: string, status: "disarmed" | "armed" | "partial") {
    const token = await this.updateToken();
    const options = {headers: {"Authorization": `Bearer ${token.access_token}`}};
    try {
      return await axios.put(`${this.baseUrl}/site/${siteId}/security`, {status}, options);
    } catch (error) {
      this.logger.error(error.message, error);
    }
  }
}
