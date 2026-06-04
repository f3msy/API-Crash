'use strict';

const XboxAPI = require("./xbox.js");
const crashConfig = {
  enabled: false,
  loop: 0
};
class realmAPI extends XboxAPI {
  constructor(config = crashConfig, debugging = false) {
    super();
    this.maxRetries = 3;
    this.crash = config;
    this.debug = debugging;
  }
  async init() {
    this.authToken = await this.getXboxToken("https://pocket.realms.minecraft.net/");
    this.headers = {
      authorization: this.authToken,
      Accept: "*/*",
      charset: "utf-8",
      "client-ref": "6e8fe469150fb2a32e233c69a51d7b44d1c01013",
      "client-version": this.crash.enabled ? "26.10" : "1.26.20",
      "x-networkprotocolversion": "944",
      "x-clientplatform": "Windows",
      "content-type": "application/json",
      "user-agent": "MCPE/UWP",
      "Accept-Language": "en-US",
      "Accept-Encoding": "gzip, deflate, br",
      Host: "pocket.realms.minecraft.net",
      Connection: "Keep-Alive"
    };
  }
  async req(_arg1, _arg2 = {}, _arg3 = "") {
    if (typeof this.authToken !== "string" && this?.authToken?.errorMsg) {
      const _0x31a496 = {
        errorMsg: this.authToken.errorMsg,
        errorCode: 404
      };
      const _0x5a5d4d = {
        status: 404,
        body: _0x31a496
      };
      return _0x5a5d4d;
    }
    const _0x57d1a6 = _arg1?.startsWith?.("http") ? _arg1 : "https://" + this.headers.Host + _arg1;
    if (_arg2.body) {
      this.headers["content-length"] = Buffer.byteLength(_arg2.body).toString();
    }
    for (this.retryCount = -1;; this.retryCount++) {
      if (this.debug) {
        console.log(_arg3 + " request attempt #" + (this.retryCount + 1) + " ~ " + (_arg2.method || "GET") + " " + _0x57d1a6);
      }
      if (this.retryCount > (this.crash.enabled && _arg1.includes("/join") ? this.crash.loop : this.maxRetries)) {
        const body = {
          errorMsg: "reached a max amount of requests for " + _arg3,
          errorCode: 429
        };
        const data = {
          status: 429,
          body: body
        };
        return data;
      }
      try {
        const resp = await fetch(_0x57d1a6, Object.assign({}, _arg2, {
          headers: this.headers,
          signal: AbortSignal.timeout(15000)
        }));
        if (resp.status === 429) {
          return {
            status: 429,
            body: {
              errorMsg: "rate limited, try again later.",
              errorCode: 429
            }
          };
        }
        if ([502, 503, 504].includes(resp.status) || resp.status >= 500) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        const jsonBody = await resp.text();
        let data;
        try {
          data = JSON.parse(jsonBody);
        } catch (e) {
          data = jsonBody || null;
        }
        const retData = {
          status: resp.status,
          body: data
        };
        return retData;
      } catch (err) {
        if (this.debug) {
          console.error(_arg3 + " failed request; ", err.message || err);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  async getRealmInfo(invite, worldData = true) {
    let realmData = null;
    const worldResp = await this.req("https://bedrock.frontendlegacy.realms.minecraft-services.net/worlds/v1/link/" + invite, {
      method: "GET"
    }, "getRealmInfo");
    if (worldResp.status !== 200) {
      console.log("Error: " + worldResp.status + " getRealmInfo");
      return worldResp;
    }
    realmData = worldResp.body;
    if (worldData) {
      return realmData;
    }
    const infoResp = await this.getRealmInfoByID(realmData.id);
    if (infoResp.status !== 200) {
      console.log("Error: " + infoResp.status + " getRealmInfoByID");
      return infoResp;
    }
    realmData = infoResp.body;
    return realmData;
  }
  async getRealmInfoByID(realmId) {
    return await this.req("https://bedrock.frontendlegacy.realms.minecraft-services.net/worlds/" + realmId, {
      method: "GET"
    }, "getRealmInfoByID");
  }
  async getRealmIP(realmId) {
    return await this.req("https://bedrock.frontendlegacy.realms.minecraft-services.net/worlds/" + realmId + "/join", {
      method: "GET"
    }, "getRealmIP");
  }
  async postStorySettings(realmId, notis, autostories, cords, timeline) {
    const realmStorySettings = {
      timeline: timeline,
      autostories: autostories,
      coordinates: cords,
      notifications: notis,
      playerOptIn: "OPT_IN",
      realmOptIn: "OPT_IN"
    };
    const jsonText = JSON.stringify(realmStorySettings);
    const body = {
      method: "POST",
      body: jsonText,
      retryServerError: false
    };
    return await this.req("https://bedrock.frontendlegacy.realms.minecraft-services.net/worlds/" + realmId + "/stories/settings", body, "postStorySettings");
  }
  async getWorlds() {
    return await this.req("https://bedrock.frontendlegacy.realms.minecraft-services.net/worlds", {
      method: "GET"
    }, "getWorlds");
  }
  async joinRealm(inviteCode) {
    return await this.req("https://bedrock.frontendlegacy.realms.minecraft-services.net/invites/v1/link/accept/" + inviteCode, {
      method: "POST"
    }, "joinRealm");
  }
}
module.exports = realmAPI;