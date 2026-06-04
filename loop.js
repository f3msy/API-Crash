'use strict';

const realmAPI = require('./func/realm');
const readline = require('readline');
const menu = '\x1B[1;37m1. \x1B[1;34mJoin realm by code.\x1B[0m\n\x1B[1;37m2. \x1B[1;34mCrash existing realm from your realmlist.\x1B[0m';
function getKeyInput() {
  return new Promise(resolve => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.once('keypress', (_, _arg2) => {
      process.stdin.setRawMode(false);
      resolve(_arg2.name);
    });
  });
}
function getTextInput(message) {
  return new Promise(resolve => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    let textBuffer = '';
    process.stdout.write(message);
    const handleKeyPress = (text, keyPressed) => {
      if (keyPressed.name === 'return') {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', handleKeyPress);
        process.stdout.write('\n');
        resolve(textBuffer);
      } else if (keyPressed.name === 'backspace') {
        if (textBuffer.length > 0) {
          textBuffer = textBuffer.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (keyPressed.name === 'escape') {
        process.stdin.setRawMode(false);
        process.stdin.removeListener('keypress', handleKeyPress);
        process.stdout.write('\n');
        resolve(null);
      } else if (text && text.length === 1 && !keyPressed.ctrl) {
        textBuffer += text;
        process.stdout.write(text);
      }
    };
    process.stdin.on('keypress', handleKeyPress);
  });
}
(async () => {
  try {
    const realmAPIInstance = new realmAPI({
      enabled: true,
      loop: 1000
    });
    await realmAPIInstance.init();
    console.clear();
    console.log(menu);
    let userInput = await getKeyInput();
    while (userInput === '1') {
      console.clear();
      const inviteCode = await getTextInput('\x1B[1;34mInsert Realm Code: \x1B[0m');
      const realmResp = await realmAPIInstance.joinRealm(inviteCode);
      if (realmResp.status === 200) {
        const _0x5352bb = realmResp?.body?.name || 'realm';
        console.log('\x1B[1;32mSuccessfully joined ' + _0x5352bb + '!\x1B[0m');
      } else {
        console.log('\x1B[1;31mFailed to join realm\x1B[0m');
        console.log('\x1B[1;33mStatus Code: ' + realmResp.status + '\x1B[0m');
        console.log('\x1B[1;33mError: ' + (realmResp?.body?.errorMsg || realmResp?.body?.error || 'Unknown error') + '\x1B[0m');
        if (realmResp?.body?.errorCode) {
          console.log('\x1B[1;33mError Code: ' + realmResp.body.errorCode + '\x1B[0m');
        }
        if (realmResp.status === 403 || realmResp.status === 401 || realmResp?.body?.errorCode === 'BANNED' || realmResp?.body?.errorMsg?.toLowerCase?.()?.includes?.(undefined)) {
          console.log('\x1B[1;31mYou may be banned from this realm!\x1B[0m');
        }
      }
      await new Promise(r => setTimeout(r, 3000));
      console.clear();
      console.log(menu);
      userInput = await getKeyInput();
    }
    const worldsResp = await realmAPIInstance.getWorlds();
    if (!worldsResp?.body?.servers || worldsResp?.body?.servers?.length === 0) {
      throw new Error('no servers found');
    }
    console.clear();
    console.log('\x1B[1;34mChecking realm states...\x1B[0m');
    const loadingStates = ['|', '/', '-', '\\'];
    let i = 0;
    const loadingInterval = setInterval(() => {
      process.stdout.write('\r\x1B[1;37m' + loadingStates[i] + '\x1B[0m');
      i = (i + 1) % loadingStates.length;
    }, 100);
    const userRealms = await Promise.all(worldsResp.body.servers.map(async (world) => {
      let found = false;
      try {
        const realmInfoResp = await realmAPIInstance.getRealmInfoByID(world.id);
        const activeSlot = (() => {
          const world = realmInfoResp?.body?.activeSlot;
          if (world != null) {
            return world;
          } else {
            return 1;
          }
        })() - 1;
        const slotData = realmInfoResp?.body?.slots?.[activeSlot];
        const versionRef = slotData ? JSON?.parse?.(slotData?.options)?.versionRef : false;
        if (world.state === 'OPEN' && versionRef) {
          try {
            const _0x3dc49e = await realmAPIInstance.getRealmIP(world.id);
            found = _0x3dc49e.status === 200;
          } catch (_0x45ab34) {
            found = false;
          }
        }
      } catch (err) {
        found = false;
      }
      const worldData = Object.assign({}, world);
      worldData.isOpen = found;
      return worldData;
    }));
    clearInterval(loadingInterval);
    process.stdout.write('\r');
    console.clear();
    console.log('' + userRealms.map(_arg1 => _arg1.isOpen ? '\x1B[1;32mopen\x1B[0m   | \x1B[1;37m' + _arg1.name + '\x1B[0m | \x1B[1;34m' + _arg1.id + '\x1B[0m' : '\x1B[1;31mclosed\x1B[0m | \x1B[1;37m' + _arg1.name + '\x1B[0m | \x1B[1;34m' + _arg1.id + '\x1B[0m').join('\n'));
    const targetId = await getTextInput('\n\x1B[1;34mInsert Realm ID: \x1B[0m');
    if (!userRealms.some(_arg1 => String(_arg1.id) === targetId)) {
      throw new Error('invalid realmID');
    }
    const targetRealm = userRealms.find(realm => String(realm.id) === targetId);
    if (!targetRealm.isOpen) {
      console.log('\x1B[1;33mRealm is marked as closed. Attempting anyway\x1B[0m');
      await new Promise(r => setTimeout(r, 1500));
    }
    const realmInfo = await realmAPIInstance.getRealmInfoByID(targetId);
    if (!realmInfo) {
      throw new Error('\x1B[1;31mno realmID provided or invalid realmID\x1B[0m');
    }
    const activeSlot = (() => {
      const _temp57438 = realmInfo?.body?.activeSlot;
      if (_temp57438 != null) {
        return _temp57438;
      } else {
        return 1;
      }
    })() - 1;
    const slotData = realmInfo?.body?.slots?.[activeSlot];
    if (!slotData || !slotData.options) {
      throw new Error('\x1B[1;31mNo valid slot data found for slot ' + activeSlot + '\x1B[0m');
    }
    let versionRef;
    try {
      const slotOptions = JSON.parse(slotData.options);
      if (slotOptions != null) {
        versionRef = undefined;
      } else {
        versionRef = slotOptions.versionRef;
      }
    } catch (err) {
      throw new Error('\x1B[1;31mFailed to parse slot options: ' + err.message + '\x1B[0m');
    }
    if (!versionRef) {
      throw new Error('\x1B[1;31mno versionRef found in slot ' + activeSlot + '\x1B[0m');
    }
    console.clear();
    console.log('\n      \x1B[1;34mRealm: \x1B[0m \x1B[1;37m' + realmInfo.body.name + '\x1B[0m | \x1B[1;37m' + realmInfo.body.id + '\x1B[0m\n\n      \x1B[1;34mslot: \x1B[0m \x1B[1;37m' + activeSlot + '\x1B[0m\n\n      \x1B[1;34mversionRef: \x1B[0m \x1B[1;37m' + versionRef + '\x1B[0m\n      ');
    realmAPIInstance.headers['client-ref'] = versionRef;
    await realmAPIInstance.getRealmIP(realmInfo.body.id);
    console.log('\x1B[1;32mCrash loop finished!\x1B[0m');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();