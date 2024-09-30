//const fcm = new FCM();
var autoremoteserver = "http://autoremotejoaomgcd.appspot.com";

function getURLParameter(url, name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url) || [, ""])[1].replace(/\+/g, '%20')) || null
}
chrome.webRequest.onBeforeRequest.addListener(function (details) {

    var form = getURLParameter(details.url, "form");
    if (!form) {
        form = getURLParameter(details.url, "FORM");
    }
    if (form != "WNSBOX" && form != "WNSHCO" && form != "WNSSCX" && form != "WNSSSV") {
        console.log(query + " not from voice command");
        return;
    }
    var query = getURLParameter(details.url, "q");
    if (query.endsWith(".")) {
        query = query.substring(0, query.length - 1);
    }
    console.log("from cortana: " + query);
    var myId = getMyId();
    if (localStorage["sendCortanaCommands"] == "true") {
        sendAutoVoiceMessage(query);
    }
    if (localStorage["closeCortanaCommands"] == "true") {
        console.log("Closing cortana tab");
        chrome.tabs.remove(details.tabId);
    }

}, { urls: ["*://www.bing.com/search*&*=WNS*"] }, ["blocking"]);
chrome.commands.onCommand.addListener(function (command) {
    var index = parseInt(command) - 1;
    if (index < optionsArray.length) {
        var arCommand = optionsArray[index];
        var device = getDevice(arCommand.key);
        if (!arCommand.dontSendText) {
            var text = prompt(arCommand.customtext ? arCommand.customtext : "Input text to " + arCommand.commandname + " on " + arCommand.name);
        }
        if (text !== null || arCommand.dontSendText) {
            sendMessage(device, arCommand, text);
        }
    }
});
var sendAutoVoiceMessage = function (message) {
    doForDevices(function (device) {
        if (device.cortana) {
            sendMessage(device, { "command": "autovoice" }, message);
        }
    });
}
var doPostString = function (url, paramsString, callback, callbackError) {

    console.log("Posting to: " + url);
    var req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onload = function (e) {
        if (callback != null) {
            callback(e.currentTarget.response);
        }
    }
    req.onerror = function (e) {
        if (callbackError != null) {
            callbackError(e.currentTarget);
        }
    }
    console.log("Posting data: " + paramsString);
    req.send(paramsString);
}
var doPost = function (url, params, callback, callbackError) {

    var paramsString = querify(params);
    doPostString(url, paramsString, callback, callbackError)
}
var querify = function (paramsObj) {
    var query = "";
    var i = 0;
    for (prop in paramsObj) {
        if (i > 0) {
            query += "&";
        }
        query += prop + "=" + encodeURIComponent(paramsObj[prop]);
        //query += prop + "=" + paramsObj[prop];
        i++;
    }
    return query;
}
var doGet = function (url, callback) {

    console.log("Getting: " + url);
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            callback(req.responseText);
        }
    };
    req.send();
}
var doGetBase64 = function (url, callback) {

    if (url == null || url == "" || url.indexOf("http") < 0) {
        callback(null);
    } else {
        console.log("Getting binary: " + url);
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function (e) {
            callback(base64ArrayBuffer(e.currentTarget.response));
        };
        xhr.onerror = function (e) {
            callback(null);
        };
        xhr.send();
    }
}
var doGetBase64Image = function (url, callback) {

    doGetBase64(url, function (base64) {
        if (base64 != null) {
            base64 = "data:image/png;base64," + base64
        }
        callback(base64);
    });
}

function base64ArrayBuffer(arrayBuffer) {
    var base64 = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes = new Uint8Array(arrayBuffer)
    var byteLength = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63 // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}
var uniqueId = function (chars) {
    var chars = (chars || 16),
        result = '';
    while (--chars) {
        result += (Math.random() * 16 | 0).toString(16)
    }
    return result;
};
var jsonp = function (url, callback) {
    var funcName = 'callback' + uniqueId();
    var script = document.createElement('script');
    url = url + (/\?/.test(url) ? '&' : '?') + "callback=" + funcName;
    script.setAttribute('src', url);
    var elem = document.getElementsByTagName('head')[0].appendChild(script);
    window[funcName] = function () {
        callback(arguments[0]);
        elem.parentNode.removeChild(elem);
    }
}

function certifyChromeNameSet() {
    if (!myNameExists()) {
        var name = prompt("What would you like to call this browser on your devices?", "Chrome");
        setMyName(name);
    }
}

function getMyQrCode(callback) {
    getMyUrl(function (myUrl) {
        if (myUrl != null) {
            callback("https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=" + myUrl);
        } else {
            callback(null);
        }
    });
}

var shortenUrl = function (url, callback) {
    var req = new XMLHttpRequest();
    //req.open("POST", "https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCA_Pv_hiwRxmMOuchBcjsJPgZOZXvgIdQ", true);
    req.open("POST", "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyCA_Pv_hiwRxmMOuchBcjsJPgZOZXvgIdQ", true);
    req.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                console.log(response);
                callback(response.shortLink);
            }
        }
    };
    var objToSend = {
        "dynamicLinkInfo": {
            "domainUriPrefix": "https://autoremote.joaoapps.com",
            "link": url
        }
    };
    var jsonToSend = JSON.stringify(objToSend);
    req.send(jsonToSend);
}

function copyToClipboard(text) {
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.body.removeChild(copyDiv);
}

function doForDevices(action) {
    var existingDevices = getExistingDevices();
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        action(device);
    }
}

function getDevice(key) {
    var existingDevices = getExistingDevices();
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        if (device.key == key) {
            return device;
        }
    }
    return null;
}

function addDevice(key, name, callback) {
    if (getDevice(key) == null) {
        shortenUrl(autoremoteserver + "/?key=" + key, function (shortUrl) {
            var devices = getExistingDevices();
            device = {
                name: name,
                url: shortUrl,
                key: key,
                password: null
            };
            devices.push(device);
            setExistingDevices(devices);
            if (callback != null) {
                callback(true);
            }
            updatemenu();
        });
    } else {
        if (callback != null) {
            callback(false);
        }
    }
}

function registerOnDevice(device) {
    getMyId(function (myId) {
        if (myId != null) {
            var urlToRegister = autoremoteserver + "/registerdevice?key=" + device.key + "&sender=" + myId + "&name=" + getMyName() + "&type=cloud";
            //		alert("Registering on device... " + urlToRegister);
            var xhr = new XMLHttpRequest();
            xhr.open("GET", urlToRegister, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    notify("AutoRemote", "Registered " + getMyName() + " on " + device.name, true);
                }
            };
            xhr.send();
        } else {
            notify("Can't register on devices", "Couldn't get personal URL key.");
        }
    });

}

function GUID() {
    var S4 = function () {
        return Math.floor(
            Math.random() * 0x10000 /* 65536 */).toString(16);
    };

    return S4() + S4() + S4();
}

function getMyUrl(callback) {
    var storedUrl = localStorage["personalurl"];
    if (storedUrl == null || storedUrl == "http://goo.gl/392otF") {
        getMyId(function (myId) {
            if (myId != null) {
                shortenUrl(autoremoteserver + "/?key=" + myId, function (url) {
                    localStorage["personalurl"] = url;
                    callback(url);
                });
            } else {
                callback(null);
            }
        });
    } else {
        callback(storedUrl);
    }
}

function updateRegIdOnServer(firstId, currentId) {

    console.log("Fixing URL");
    console.log("firstId: " + firstId);
    console.log("currentId: " + currentId);
    doGet(autoremoteserver + "/registeruser?firstKey=" + firstId + "&currentKey=" + currentId, function (result) {
        console.log("Result from fixing url: " + result);
    });

}
function getGCMToken() {
    return new Promise((accept, reject) => {
        chrome.gcm.register(["147354672683"], token => accept(token));
    });
}
async function registerGCM(callback) {
    const registrationId = await getGCMToken();
    if (registrationId == null || registrationId == "") {
        if (callback != null) {
            console.log("Error getting key: " + chrome.runtime.lastError.message);
            callback(null);
        }
    } else {
        callback(registrationId);
    }
}
function getMyUniqueId() {

    var storedId = localStorage["id"];
    var storedIdGcm = localStorage["idgcm"];
    var id = null;
    if (storedId != null && storedId.indexOf("goo.gl:gcm") > 0) {
        id = storedId;
    } else if (storedIdGcm != null && storedIdGcm.indexOf("goo.gl:gcm") > 0) {
        id = storedIdGcm;
    }
    if (id != null) {
        var split = id.split("goo.gl:gcm");
        return split[0];
    } else {
        return null;
    }
}
var askedToGetNewUrl = false;
function getMyId(callback) {
    var storedId = localStorage["id"];
    if (storedId == null || (storedId.indexOf("goo.gl") >= 0 && storedId.indexOf("goo.gl:new") < 0) || storedId == "goo.gl:new") {
        registerGCM(
            function (registrationId) {
                if (registrationId == null) {
                    if (callback != null) {
                        callback(null);
                    }
                } else {
                    var channelId = "goo.gl:gcm" + registrationId;
                    localStorage["id"] = channelId;
                    if (callback != null) {
                        callback(channelId);
                    }
                }
            });
    } else {

        var storedIdGcm = localStorage["idgcm"];
        if (storedIdGcm == null) {
            registerGCM(
                function (registrationId) {
                    if (registrationId != null) {
                        var channelId = "goo.gl:gcm" + registrationId;
                        localStorage["idgcm"] = channelId;
                        updateRegIdOnServer(storedId, channelId);
                        if (!askedToGetNewUrl && storedId != channelId) {
                            askedToGetNewUrl = true;
                            var result = confirm("AutoRemote Chrome Extension now supports different personal URLs on different PCs for the same account.\n\nYou can still keep your old URL in one of your browsers (normally your main browser so your current Tasks still work).\n\nWould you like to give this PC a unique personal URL?");
                            if (result) {
                                getUniqueUrl(function () {
                                    alert("Ok, you now have a unique personal URL on this PC.\n\nCheck it out in the AutoRemote extension options.");
                                });
                            } else {
                                alert("Ok, you can always get a unique URL for this PC in the AutoRemote Extension options.");
                            }

                        }
                    }
                });
        }
        if (callback) {
            callback(storedId);
        }
    }
    return storedId;

}
function getUniqueUrl(callback) {
    resetMyIds();
    getMyUrl(callback);
}
function resetMyIds() {

    localStorage.removeItem("id");
    localStorage.removeItem("idgcm");
    localStorage.removeItem("personalurl");
}
function getIdFromLocalStorage() {
    return localStorage["id"];
}
function getIdGCMFromLocalStorage() {
    return localStorage["idgcm"];
}
function getMyName() {
    return localStorage["name"];
}

function setMyName(name) {
    localStorage["name"] = name;
}

function myNameExists() {
    var exists = localStorage["name"] != null;
    return exists;
}

function getMyToken() {
    return localStorage["token"];
}

function setMyToken(token) {
    localStorage["token"] = token;
}

function resetToken() {
    localStorage.removeItem("token");
}

function myTokenExists() {
    return localStorage["token"] != null;
}
var optionsArray = [];
var getIcon = function (potentialIcon) {
    return potentialIcon != null ? potentialIcon : 'autoremotebig.png';
}

function notify(title, description, system, timeToDisplay, received) {
    var notification = new Notification();
    notification.title = title;
    notification.text = description;
    notification.notify(system, timeToDisplay, received);
}

function getExistingDevices() {
    if (localStorage["devices"] == null) {
        setExistingDevices([]);
    }
    return JSON.parse(localStorage["devices"]);
}

function setExistingDevices(devices) {
    localStorage["devices"] = JSON.stringify(devices);
}

function getForDevice(key, func) {
    var existingDevices = getExistingDevices();
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        if (device.key == key) {
            return func(device);
        }
    }
}
function getForDeviceAndSave(key, func) {
    var result = null;
    var existingDevices = getExistingDevices();
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        if (device.key == key) {
            result = func(device);
            break;
        }
    }
    setExistingDevices(existingDevices);
    return result;
}

function sendMessage(device, option, message) {

    var m = new Message();
    if (option.dontSendText) {
        m.message = option.command;
    } else {
        m.message = option.command + "=:=" + message;
    }
    m.key = device.key;
    m.target = option.target;
    m.password = getForDevice(m.key, function (device) {
        return device.password;
    });
    if (option.sendSelectedFile) {
        m.files = message;
    }
    m.sender = getMyId();
    m.send();
    /*getMyId(function(myId){
    if(optionsArray[i].dontSendText)
    {
        message = optionsArray[i].command;
    }
    else
    {
        message = optionsArray[i].command + "=:=" + message;
    }
    var key = optionsArray[i].key;
    var target = optionsArray[i].target;
    var password = getForDevice(key, function(device)
    {
        return device.password;
    });
    var urlToCall = autoremoteserver+"/sendmessage?message=" + encodeURIComponent(message) + "&key=" + key + "&sender=" + myId;
    if(password != null && password != "") urlToCall = urlToCall + "&password=" + password;
    if(target != null && target != "") urlToCall = urlToCall + "&target=" + target;
    var req = new XMLHttpRequest();

    req.open("GET", urlToCall, true);
    notify("Sending message...", "Connecting...");
    req.onreadystatechange = function()
    {
        if(req.readyState == 4 && req.status == 200)
        {
            var title = null;
            var description = null;
            if(req.responseText == "OK")
            {
                title = "Message Sent to " + optionsArray[i].name + "!";
                description = message;
            }
            else
            {
                title = "Message NOT Sent!";
                description = req.responseText;
            }
            notify(title, description);
        }
    };
    req.send(null);
});
*/
}

function sendLinkToAutoRemote(device, link) {
    getMyId(function (myId) {
        var req = new XMLHttpRequest();
        notify("Sending link...", "Connecting...", true);
        req.open("GET", autoremoteserver + "/sendintent?intent=" + encodeURIComponent(link) + "&key=" + device.key + "&sender=" + myId, true);
        req.onreadystatechange = function () {
            if (req.readyState == 4 && req.status == 200) {
                var title = null;
                var description = null;
                if (req.responseText == "OK") {
                    title = "Link sent to " + device.name + "!";
                    description = "Opening " + link;
                } else {
                    title = "Link NOT Sent!";
                    description = req.responseText;
                }
                notify(title, description);
            }
        };
        req.send(null);

    });

}

function sendText(device, option) {
    return function (info, tab) {
        sendMessage(device, option, info.selectionText);
    };

}

function sendPage(device, option) {
    return function (info, tab) {
        sendMessage(device, option, info.pageUrl);
    };
}

function sendLink(device) {
    return function (info, tab) {
        sendLinkToAutoRemote(device, info.linkUrl);
    };
}

function sendImage(device, option) {
    return function (info, tab) {
        sendMessage(device, option, info.srcUrl);
    };
}

function sendVideo(device, option) {
    return function (info, tab) {
        sendMessage(device, option, info.srcUrl);
    };
}

function sendAudio(device, option) {
    return function (info, tab) {
        sendMessage(device, option, info.srcUrl);
    };
}

function sendPageAsLink(device) {
    return function (info, tab) {
        sendLinkToAutoRemote(device, info.pageUrl);
    };
}

function sendLinkAsMessage(device, option) {
    return function (info, tab) {
        sendMessage(device, option, info.linkUrl);
    };
}

function updatemenu() {
    if (localStorage["items"] != null) {
        optionsArray = JSON.parse(localStorage["items"]);
    }
    var uniqueKeysDone = [];
    chrome.contextMenus.removeAll();
    // Create one test item for each context type.
    var contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
    var contextFuncs = [{
        "context": "page"
    }, {
        "context": "selection",
        "onclick": sendText
    }, {
        "context": "link",
        "onclick": sendText
    }, {
        "context": "editable"
    }, {
        "context": "image"
    }, {
        "context": "video"
    }, {
        "context": "audio"
    }];
    var funcs = [];
    for (var i = 0; i < contexts.length; i++) {
        var context = contexts[i];
        doForDevices(function (device) {
            var func = null;
            if (context == "page") {
                func = sendPageAsLink(device);
            }
            if (context == "link") {
                func = sendLink(device);
            }
            if (func != null) {
                func = {
                    "func": func
                };
                func.command = "Open";
                func.context = context;
                func.name = device.name;
                func.dontSendText = false;
                func.sendSelectedFile = false;
                funcs.push(func);
            }
        });
        for (var e = 0; e < optionsArray.length; e++) {
            var item = optionsArray[e];
            var device = getDevice(item.key);
            var currentCommand = item.command;
            var dontSendText = item.dontSendText;
            var sendSelectedFile = item.sendSelectedFile;
            if (currentCommand != null && currentCommand != "") {
                var func = null;
                if (context == "selection") {
                    func = sendText(device, item);
                }
                if (context == "image") {
                    func = sendImage(device, item);
                }
                if (context == "video") {
                    func = sendVideo(device, item);
                }
                if (context == "audio") {
                    func = sendAudio(device, item);
                }
                if (context == "page") {
                    func = sendPage(device, item);
                }
                if (context == "link") {
                    func = sendLinkAsMessage(device, item);
                }
                if (func != null) {
                    func = {
                        "func": func
                    };
                    func.command = item.commandname;
                    func.customtext = item.customtext;
                    func.context = context;
                    func.name = item.name;
                    func.dontSendText = dontSendText;
                    func.sendSelectedFile = sendSelectedFile;
                    funcs.push(func);
                }
            }
        }
    }
    createMenuFromFuncs(funcs);
}

var createMenuFromFuncs = function (funcs) {
    for (var j = 0; j < funcs.length; j++) {
        var func = funcs[j];
        var title = func.command + " " + func.context + " on " + func.name;
        if (func.dontSendText) {
            title = func.command + " on " + func.name;
        }
        if (func.sendSelectedFile) {
            title += " with selected file"
        }
        if (func.customtext != null && func.customtext != "") {
            title = func.customtext;
        }
        chrome.contextMenus.create({
            "title": title,
            "contexts": [func.context],
            "onclick": func.func
        });
    }
}

function handleAutoRemoteCommandMessageToPort(message, port) {
    doPost("http://localhost:" + port + "/", message, function (response) {
        alert(response);
    });
}

function handleAutoRemoteCommandMessage(url) {
    var command = url.substring(url.indexOf("message=") + "message=".length)
    var req = new XMLHttpRequest();
    notify("Redirecting AutoRemote command...", command, true);
    req.open("GET", url, true);
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            var title = null;
            var description = null;
            if (req.responseText == "OK") {
                title = "Command redirected!";
                description = command
            } else {
                title = "Command NOT Sent!";
                description = req.responseText;
            }
            notify(title, description, true);
        }
    };
    req.send();
}

function openMessageChannel() {
    doForDevices(registerOnDevice);
}
/*
var socket;
function openMessageChannelWithDelay(){
setTimeout(openMessageChannel, 5000);
}
function openMessageChannel()
{
var channel;
var handler = {
    onopen: function()
    {
        notify("AutoRemote", "Listening to messages now!", true);
        doForDevices(registerOnDevice);
    },
    onerror: function(error)
    {
        var description = error.description.replace("+", " ");
        var invalidToken = error.description.indexOf("Invalid") >= 0;
        var tokenTimedOut = error.description.indexOf("ime") >= 0;
        if(tokenTimedOut || invalidToken)
        {
            notify("AutoRemote", description + "... Refreshing connection...", true);
            resetToken();
            openMessageChannel();
        }
    },
    onclose: function()
    {
            openMessageChannelWithDelay();
    },
    onmessage: function(evt)
    {
        var message = evt.data;
        if(message.indexOf("http://localhost")>=0){
            handleAutoRemoteCommandMessage(message);
        }else{
            var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
            var matches = message.match(expression);
            if(matches != null){
                for(var i=0;i<matches.length;i++) {				
                    var url = matches[i];
                    if(url.indexOf("http") < 0)
                    {
                        url = "http://" + message;
                    }
                	
                        chrome.tabs.create(
                        {
                            'url': url
                        }, function(tab)
                        {});
                	
                }
            }
            notify("AutoRemote Message", message);				
        }
    }
};
var openChannel = function(token)
    {
        channel = new goog.appengine.Channel(token);			
        socket = channel.open(handler);
        setMyToken(token);
    };
if(!myTokenExists())
{
    var xhr = new XMLHttpRequest();
    var url = "http://autoremotejoaomgcd.appspot.com/openappenginechannel?id=" + getMyId();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function()
    {
        if(xhr.readyState == 4 && xhr.status == 200)
        {
            notify("AutoRemote", "Opening new channel to receive messages...", true, 10000);
            token = xhr.responseText;
            openChannel(token);
        }
        if(xhr.status == 500)
        {
            notify("AutoRemote", "Can't listen to messages. Server has reached its limit.", true);
        }
    };
    xhr.send();
}
else
{
    notify("AutoRemote", "Reusing existing channel to receive messages...", true);
    if(!socket){
        openChannel(getMyToken());
    }else{
        socket.close();
        socket = null;
    }
}
}*/
var Communication = function () {
    this.key = null;
    this.sender = getMyId();
    var payload = null;
    this.setPayload = function (payloadReceived) {
        payload = payloadReceived;
    }
    this.executeRequest = function () {
        if (this.shouldRedirect()) {
            this.redirect();
        } else {
            this.executeRequestSpecific();
        }
    }
    this.redirect = function () {

        console.log("Redirecting " + this.getCommunicationType());
        var url = this.getRedirectUrl();
        var params = payload;
        var me = this;
        doPostString(url, params, function (response) {
            var title = null;
            var description = null;
            console.log(response);

            var response = getCommunicationFromPayload(response);
            response.communication_base_params.sender = response.sender;
            if (response.sendRedirectResponse()) {
                response.send(true);
            }

            title = me.getCommunicationType() + " redirected.";
            description = me.getDescription();

            notify(title, description, true);

        }, function (responseObj) {
            notify("Error", "Can't redirect " + me.getCommunicationType());
        });
    }
    this.getCommunicationType = function () {
        return "Communication";
    }

    this.setCommunicationBaseParams = function () {
        this.communication_base_params = {
            "sender": getMyId(),
            "type": this.getCommunicationType()
        };
    }

    this.getParams = function () {
        this.setCommunicationBaseParams();
        var json = new Object();
        for (prop in this) {
            json[prop] = this[prop];
        }
        return JSON.stringify(json);
    }

    this.getParamsGCM = function (isResponse) {
        var type = (isResponse ? "response" : "request");
        var params = {
            "key": this.key,
            "sender": this.sender
        }
        params[type] = this.getParams();
        return params;
    }

    this.fromJson = function (json) {
        for (prop in json) {
            this[prop] = json[prop];
        }
    }
    this.fromJsonString = function (str) {
        var json = JSON.parse(str);
        this.fromJson(json);
    }
    this.getRedirectPort = function () {
        var port = localStorage["redirectPort"];
        if (port == "") {
            port = null;
        }
        return port;
    }

    this.getRedirectUrl = function () {
        var port = this.getRedirectPort();
        if (port == null) {
            port = "1818";
        }
        return "http://localhost:" + port + "/";
    }
    this.shouldRedirect = function () {
        return (this.communication_base_params && this.communication_base_params.fallback) || localStorage["redirectAllMessages"] == "true";
    }
    this.send = function (isResponse) {

        //var url = 'http://localhost:8888/' + this.getHttpEndpoint();
        var url = autoremoteserver + "/" + this.getHttpEndpoint();
        this.doBeforeSend()
        var params = this.getParamsGCM(isResponse)
        var me = this;
        doPost(url, params, function (response) {
            var title = null;
            var description = null;
            if (response == "OK") {
                var deviceSentTo = getDevice(me.key);
                if (deviceSentTo != null) {
                    title = me.getCommunicationType() + " sent to " + deviceSentTo.name + "!";
                } else {
                    title = me.getCommunicationType() + " sent!";
                }
                description = me.getDescription();
            } else {
                title = me.getCommunicationType() + " NOT sent!";
                description = response;
            }
            if (me.getShowSentNotification()) {
                notify(title, description, isResponse);
            }
            me.doAfterSending(response);
        }, function (responseObj) {
            notify("Error", "Can't send " + me.getCommunicationType());
        });

    }

    this.doAfterSending = function (response) {

    }
    this.getDescription = function () {

    }
    this.getShowSentNotification = function () {
        return true;
    }

    this.openUrl = function (url) {
        chrome.tabs.create({
            'url': url
        }, function (tab) {
            if (url.indexOf("www.youtube.com/tv") > 0) {
                chrome.windows.update(tab.windowId, {
                    state: "fullscreen"
                });
            }
        });
    }
};

var Request = function () {
    this.ttl = "0";
    this.collapseKey = null;

    this.getHttpEndpoint = function () {
        return 'sendrequest';
    }

    this.doBeforeSend = function () {
        if (this.ttl == null || this.ttl == "") {
            this.ttl = "0";
        }
        this.password = getForDevice(this.key, function (device) {
            return device.password;
        });
    }
};
Request.prototype = new Communication();

var Response = function () {
    this.responseError = null;

    this.getHttpEndpoint = function () {
        return 'sendresponse';
    }

    this.handleResponse = function () {

    }
    this.doBeforeSend = function () {


    }

    this.sendRedirectResponse = function () {
        return false;
    }
};
Response.prototype = new Communication();

var ResponseNoAction = function () {
    this.getCommunicationType = function () {
        return "ResponseNoAction";
    }
};

ResponseNoAction.prototype = new Response();

var RequestVersion = function () {
    this.getCommunicationType = function () {
        return "RequestVersion";
    }
};

RequestVersion.prototype = new Request();

var ResponseVersion = function () {
    this.version = null;
    this.getCommunicationType = function () {
        return "ResponseVersion";
    }
    this.sendRedirectResponse = function () {
        return true;
    }
};

ResponseVersion.prototype = new Response();

var RequestGetRegistration = function () {
    this.getCommunicationType = function () {
        return "RequestGetRegistration";
    }
};

RequestGetRegistration.prototype = new Request();
var ResponseGetRegistration = function () {
    this.id = null;
    this.type = null;
    this.name = null;
    this.localip = null;
    this.publicip = null;
    this.port = null;
    this.haswifi = true;
    this.getCommunicationType = function () {
        return "ResponseGetRegistration";
    }
    this.sendRedirectResponse = function () {
        return true;
    }
};

ResponseGetRegistration.prototype = new Response();

var urlExpression = /^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:127)(?:\.\d{1,3}){3})(?!(?:169\.254)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;
var openUrlIfTextMatches = function (text) {
    var matches = text.match(urlExpression);
}
var Message = function () {
    this.message = null;
    this.files = null;
    this.password = null;
    this.buttonAction = false;
    this.getCommunicationType = function () {
        return "Message";
    }

    this.executeRequestSpecific = function () {
        var matches = this.message.match(urlExpression);
        if (matches != null) {
            for (var i = 0; i < matches.length; i++) {
                var url = matches[i];
                if (url.indexOf("http") < 0) {
                    url = "http://" + this.message;
                }

                this.openUrl(url);

            }
        }
        if (this.files != null && this.files != "") {
            this.files = this.files.split(",");
            for (var i = 0; i < this.files.length; i++) {
                this.openUrl(this.files[i]);
            }
        }
        notify("AutoRemote Message", this.message, false, null, true);
    }


    this.doAfterSending = function (response) { }
    this.getDescription = function () {
        return this.message;
    }
    this.getShowSentNotification = function () {
        return localStorage["showNotificationsActions"] == null || localStorage["showNotificationsActions"] == "true" || !this.buttonAction;
    }
};
Message.prototype = new Request();

var RequestSendRegistration = function () {
    this.id = null;
    this.name = null;
    this.getCommunicationType = function () {
        return "RequestSendRegistration";
    }

    this.executeRequestSpecific = function () {
        var me = this;
        addDevice(this.id, this.name, function (result) {
            if (result) {
                notify("Received Device", me.name + " added to your device list.");
            } else {
                notify("Received Device", me.name + " was already on your list.");
            }
            saveSettingsToSync();
        });
    }

};
RequestSendRegistration.prototype = new Request();

var RequestSendRegistrations = function () {
    this.devices = [];
    this.getCommunicationType = function () {
        return "RequestSendRegistrations";
    }

    this.executeRequestSpecific = function () {
        var me = this;
        notify("Received Devices", "Adding " + this.devices.length + " devices to your device list.");
        for (var i = 0; i < this.devices.length; i++) {
            var device = this.devices[i];
            addDevice(device.id, device.name);
        }
        setTimeout(saveSettingsToSync, 1000);

    }

};
RequestSendRegistrations.prototype = new Request();

var Notification = function () {

    this.title = null;
    this.text = null;
    this.subtext = null;
    this.icon = null;
    this.picture = null;
    this.message = null;
    this.action = null;
    this.actionpopup = null;
    this.action1 = null;
    this.action1name = null;
    this.action1icon = null;
    this.action1iconpath = null;
    this.button1popup = null;
    this.action2 = null;
    this.action2name = null;
    this.action2icon = null;
    this.action2iconpath = null;
    this.button2popup = null;
    this.action3 = null;
    this.action3name = null;
    this.action3icon = null;
    this.action3iconpath = null;
    this.actionondismiss = null;
    this.dismisspopup = null;
    this.url = null;
    this.id = null;
    this.cancel = false;

    var me = this;

    this.getCommunicationType = function () {
        return "Notification";
    }
    this.shouldRedirect = function () {
        return false;
    }
    this.getButtonMessage = function (index) {
        if (index == 0) {
            return this.action1;
        } else if (index == 1) {
            return this.action2;
        }
    }
    this.getButtonPopup = function (index) {
        if (index == 0) {
            return this.button1popup;
        } else if (index == 1) {
            return this.button2popup;
        }
    }
    this.executeRequestSpecific = function () {
        if (this.action1name == "") {
            this.action1name = null;
        }
        if (this.action2name == "") {
            this.action2name = null;
        }
        if (this.action1icon == "AutoRemote") {
            this.action1icon = null;
        }
        if (this.action2icon == "AutoRemote") {
            this.action2icon = null;
        }
        this.notify(false, null, true);
    }
    this.sendMessage = function (text, popupText) {
        if (popupText == null || popupText == "") {
            if (text != null && text != "") {
                var message = new Message();
                message.buttonAction = true;
                message.key = this.sender;
                message.sender = getMyId();
                message.message = text;
                message.send();
            }
        } else {
            var popupInput = prompt(popupText);
            if (popupInput != null) {
                text = text + popupInput;
                this.sendMessage(text);
            }
        }
    }
    this.sendButtonMessage = function (buttonIndex) {
        this.sendMessage(this.getButtonMessage(buttonIndex), this.getButtonPopup(buttonIndex));
    }
    this.sendActionMessage = function () {
        if (this.url == null) {
            this.sendMessage(this.action, this.actionpopup);
        } else {
            this.openUrl(this.url);
        }
    }
    this.sendActionOnDismissMessage = function () {
        this.sendMessage(this.actionondismiss, this.dismisspopup);
    }
    this.notify = function (system, timeToDisplay, received) {
        if (me.cancel && me.id != null) {
            chrome.notifications.clear(me.id, function () { });
        } else {
            if (this.message != null) {
                this.sendMessage(this.message);
            }
            var showNotifications = localStorage["showNotifications"] == null || localStorage["showNotifications"] == "true";
            var showSystemNotifications = localStorage["showNotificationsSystem"] == null || localStorage["showNotificationsSystem"] == "true";
            if ((showNotifications && !system) || (showSystemNotifications && system)) {

                if (received == null) {
                    received = false;
                }
                if (timeToDisplay == null || !timeToDisplay) {
                    timeToDisplay = 3000;
                }
                var autoHideOptionSelected = localStorage["autoHideNotifications"] == "true";
                var autoHideOptionReceivedSelected = localStorage["autoHideNotificationsReceived"] == "true";
                var shouldClearNotification = (!received && autoHideOptionSelected) || (received && autoHideOptionReceivedSelected) || system;
                if (!chrome.notifications) {
                    //doGet("http://localhost:8888/getimageurl?url=http://www.gravatar.com/avatar/88f13000ab7cc1f5eaa62c6a78632b4d?s=32&d=identicon&r=PG", function(imageUrl){
                    var notification = webkitNotifications.createNotification('autoremotebig.png', this.title, this.text);
                    notification.show();
                    if (shouldClearNotification) {
                        setInterval(function () {
                            notification.cancel();
                        }, timeToDisplay);
                    }
                    //});
                } else {

                    doGetBase64Image(me.action1iconpath, function (button1IconBase64) {
                        doGetBase64Image(me.action2iconpath, function (button2IconBase64) {
                            doGetBase64Image(me.action3iconpath, function (button3IconBase64) {
                                doGetBase64Image(me.picture, function (imageBase64) {
                                    doGetBase64Image(me.icon, function (iconBase64) {
                                        if (me.title == null) {
                                            me.title = "";
                                        }
                                        if (me.text == null) {
                                            me.text = "";
                                        }
                                        var options = {
                                            type: imageBase64 != null ? "image" : "basic",
                                            title: me.title,
                                            message: me.text,
                                            expandedMessage: me.subtext,
                                            iconUrl: getIcon(iconBase64)
                                        }
                                        if (imageBase64 != null) {
                                            options.imageUrl = imageBase64;
                                        }
                                        var buttons = [];
                                        if (me.action1name != null) {
                                            var label = me.action1name;
                                            var icon = getIcon(button1IconBase64);
                                            buttons.push({
                                                title: label,
                                                iconUrl: icon
                                            });
                                        }
                                        if (me.action2name != null) {
                                            var label = me.action2name;
                                            var icon = getIcon(button2IconBase64);
                                            buttons.push({
                                                title: label,
                                                iconUrl: icon
                                            });
                                        }
                                        if (me.action3name != null) {
                                            var label = me.action3name;
                                            var icon = getIcon(button3IconBase64);
                                            buttons.push({
                                                title: label,
                                                iconUrl: icon
                                            });
                                        }
                                        options.buttons = buttons;

                                        //options.requireInteraction = true;
                                        var id = me.id;
                                        if (id == null) {
                                            id = GUID();
                                        }
                                        chrome.notifications.create(id, options, function (notificationId) {
                                            window[notificationId] = me;
                                            if (shouldClearNotification) {
                                                setInterval(function () {
                                                    chrome.notifications.clear(notificationId, function () { })
                                                }, timeToDisplay);
                                            }
                                        });

                                    });
                                });
                            });
                        });
                    });

                }
            }

        }
    }
};
Notification.prototype = new Request();
chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
    var notification = window[notificationId];
    if (notification) {
        notification.sendButtonMessage(buttonIndex);
    } else {
        var func = window[notificationId.replace("func", "")];
        if (func) {
            func(notificationId, buttonIndex);
        }
    }
});
chrome.notifications.onClicked.addListener(function (notificationId) {
    var notification = window[notificationId];
    if (notification) {
        notification.sendActionMessage();
    } else {
        var func = window[notificationId.replace("func", "")];
        if (func) {
            func(notificationId);
        }
    }
});
chrome.notifications.onClosed.addListener(function (notificationId, byUser) {
    if (!byUser) {
        return;
    }
    var notification = window[notificationId];
    notification.sendActionOnDismissMessage();
    window[notificationId] = null;
});

var getCommunicationFromPayload = function (payload) {
    var requestJsonString = payload;
    var json = JSON.parse(requestJsonString);
    var type = json.communication_base_params.type;
    console.log("Received communication of type: " + type);
    var communication = new window[type]();
    communication.setPayload(payload);
    communication.fromJson(json)
    return communication;
}
var settingsToNotSave = ["id", "idgcm", "personalurl"];
var saveSettingsToSync = function () {
    var objectSync = {};
    for (var prop in localStorage) {
        var shouldSaveIndex = settingsToNotSave.indexOf(prop);
        if (shouldSaveIndex == -1) {
            objectSync[prop] = localStorage[prop];
        }
    }
    var objLocalStorage = {
        "localStorage": objectSync,
        "lastSync": new Date().toString()
    };
    localStorage["lastSync"] = new Date().toString();
    chrome.storage.sync.set(objLocalStorage);
}
var restoreSettingsFromSync = function (callback) {
    chrome.storage.sync.get(null, function (values) {
        if (values.localStorage) {
            if (!localStorage["lastSync"]) {
                localStorage["lastSync"] = new Date(0, 0, 0).toString();
            }
            if (!values.lastSync || typeof values.lastSync != "string") {
                values.lastSync = new Date().toString();
            }
            var lastSyncSync = new Date(values.lastSync);
            var lastSyncLocal = new Date(localStorage["lastSync"]);
            if (lastSyncSync > lastSyncLocal) {
                for (var prop in values.localStorage) {
                    localStorage[prop] = values.localStorage[prop];
                }
                localStorage["lastSync"] = new Date().toString();
            }
            if (callback) callback();
        } else {
            if (callback) callback();
        }
    });
}
var syncSettings = function () {
    chrome.storage.sync.get("localStorage", function (values) {
        if (!values.localStorage) {
            console.log("No sync available. Saving local to sync.");
            saveSettingsToSync();
            certifyChromeNameSet();
        } else {
            console.log("Sync available. Restoring if newer.");
            restoreSettingsFromSync(function () {
                certifyChromeNameSet();
            });
        }
    });
}
updatemenu();
syncSettings();
chrome.storage.onChanged.addListener(function () {
    restoreSettingsFromSync(function () {
        if (syncChangedCallback) {
            syncChangedCallback();
        }
    });
});
var handleMessage = function (message) {
    var message = message.data;
    if (message != null && message != "") {
        console.log("Received gcm:");
        console.log(message);
        if (message.request != null) {
            var myUniqueId = getMyUniqueId();
            if (message.recipient == null || message.recipient == myUniqueId) {
                var communication = getCommunicationFromPayload(message.request);
                communication.executeRequest();
            }
        } else if (message.intent != null) {
            notify("Opening URL", message.intent);
            chrome.tabs.create({
                'url': message.intent
            });
        } else {
            message = message.message;
            var m = new Message();
            m.setPayload(JSON.stringify({
                "message": message,
                "communication_base_params": {
                    "type": "Message"
                }
            }));
            m.message = message;
            m.executeRequest();
        }
    } else {
        getMyId(function (myId) {
            if (myId != null) {
                var url = autoremoteserver + "/getsavedmessages?key=" + myId;
                //var url = "http://localhost:8888/getsavedmessages?key=" + myId;
                notify("", "Getting stored messages from server...", true);
                doGet(url, function (response) {
                    var responseObject = JSON.parse(response);
                    if (responseObject.messages.length > 0) {
                        for (var i = 0; i < responseObject.messages.length; i++) {
                            var message = responseObject.messages[i];
                            if (message != null && message != "") {
                                handleMessage({
                                    "payload": message
                                });
                            }
                        };
                    }
                });
            } else {
                notify("", "Can't get messages. Personal Key is null.");
            }
        });
    }
}

chrome.gcm.onMessage.addListener(handleMessage);
var onCortanaEnabled = function (notificationId, buttonIndex) {
    chrome.tabs.create({
        'url': "http://joaoapps.com/autovoiceiosfiles/Remote_AutoVoice.prf.xml"
    });
}
var openOptions = function (notificationId, buttonIndex) {
    if (buttonIndex == 0) {
        localStorage["sendCortanaCommands"] = true;
        localStorage["closeCortanaCommands"] = true;

        var options = {
            "type": "basic",
            "iconUrl": "autoremotebig.png",
            "title": "Cortana Commands",
            "message": "Cortana Commands are now enabled. Please select which devices you want to receive the commands. Also import the linked Tasker profile to use the commands in AutoVoice."
        };
        chrome.notifications.create('onCortanaEnabledfunc', options);
    }
    chrome.tabs.create({
        'url': "chrome-extension://hglmpnnkhfjpnoheioijdpleijlmfcfb/options.html"
    });
    console.log("options click");
}

var showCortanaNotification = function () {

    var options = {
        "type": "basic",
        "iconUrl": "autoremotebig.png",
        "title": "Cortana Commands",
        "message": "If you're on Windows 10 you can now redirect Cortana commands to AutoVoice. Click below to enable now.",
        "buttons": [{
            "title": "Enable",
            "iconUrl": "autoremotebig.png"
        }]
    };
    chrome.notifications.create('openOptionsfunc', options);
}



//var communication = getCommunicationFromPayload('{"icon":"https:\/\/docs.google.com\/uc?id=0B8G77eDgeMdwMmkwcnA5eUV2M0U&export=download","text":"Fac ","action3icon":"AutoRemote","cancel":false,"statusbaricon":"AutoRemote","ttl":-12114,"dismissontouch":false,"password":"","communication_base_params":{"type":"Notification"},"action2icon":"AutoRemote","sender":"joao","share":false,"title":"Vs ","action1icon":"AutoRemote","persistent":false,"priority":0,"sound":"","indeterminateprogress":false} ');
//communication.executeRequest();

//openMessageChannel();