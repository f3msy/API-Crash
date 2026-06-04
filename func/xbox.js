"use strict";

const _require = require("prismarine-auth");
const Authflow = _require.Authflow;
const Titles = _require.Titles;
class XboxAPI {
  constructor(_arg1 = null) {
    this.flow = new Authflow(undefined, "./meow", {
      flow: "sisu",
      authTitle: Titles.MinecraftAndroid,
      deviceType: "Android"
    }, deviceCodeResp => {
      console.clear();
      console.log("\x1b[1;37mYou first need to link your Microsoft account to Xbox Live. Please open the link below and sign in_.\x1b[0m\n");
      console.log("\x1b[1;34mhttp://microsoft.com/link?otc=" + deviceCodeResp.user_code + "\x1b[0m");
    });
  }
  async getXboxToken(relyingParty) {
    let xblToken = await this.flow.getXboxToken(relyingParty);
    if (typeof xblToken.userXUID === "string" || typeof xblToken.userXUID === "number") {
      this.xuid = xblToken?.userXUID;
    }
    return "XBL3.0 x=" + xblToken.userHash + ";" + xblToken.XSTSToken;
  }
  async getXboxUser(xuid) {
    if (!xuid) {
      return;
    }
    const xblToken = await this.getXboxToken();
    if (xblToken?.errorMsg) {
      return xblToken;
    }
    const resp = await fetch("https://peoplehub.xboxlive.com/users/me/people/xuids(" + xuid + ")/decoration/detail,preferredColor,presenceDetail", {
      method: "GET",
      headers: {
        "x-xbl-contract-version": 4,
        "Accept-Encoding": "gzip, deflate",
        Accept: "application/json",
        "User-Agent": "WindowsGameBar/5.823.1271.0",
        "Accept-Language": "en-US",
        Authorization: xblToken,
        Host: "peoplehub.xboxlive.com",
        Connection: "Keep-Alive"
      }
    });
    switch (resp.status) {
      case 200:
        const _0x1bec30 = (await resp.json()).people[0];
        return _0x1bec30;
      case 400:
      case 401:
        return null;
      default:
        console.log({
          errorMsg: resp.status + " " + resp.statusText + " " + (await resp.text())
        });
    }
  }
}
module.exports = XboxAPI;