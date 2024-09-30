const call = (name) => CrossContext.call(name, CrossContext.TARGET_OFFSCREEN);
const backgroundPage = {
    getExistingDevices: call("getExistingDevices"),
    getDevice: call("getDevice"),
    getMyUrl: call("getMyUrlAsync"),
    getMyQrCode: call("getMyQrCode"),
    getIdFromLocalStorage: call("getIdFromLocalStorage"),
    getIdGCMFromLocalStorage: call("getIdGCMFromLocalStorage"),
    getUniqueUrl: call("getUniqueUrlAsync"),
    updatemenu: call("updatemenu"),
    saveSettingsToSync: call("saveSettingsToSync"),
    setExistingDevices: call("setExistingDevices"),
    handleMessage: call("handleMessage")
}
chrome.extension.getBackgroundPage = () => {
    return backgroundPage;
};