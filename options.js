chrome.extension.getBackgroundPage().syncChangedCallback = function() {
    restore_options();
}
/*const init = async ()=>{
    const fcm = new FCM();
    await fcm.requestPermission();
    const token = await fcm.getToken();
    console.log("Token: " + token);
}
init();*/
var createElement = function(parent, tag, id, attributes) {
    var el = document.createElement(tag);
    el.setAttribute('id', id);
    if (attributes !== undefined) {
        for (attribute in attributes) {
            var attributeName = attribute;
            var attributeValue = attributes[attribute];
            //no caso do IE tem que se usar a propriedade "className" senão o estilo não é aplicado. Também são usadas regras CSS específicas para IE porque este não suporta animações
            if (attributeName == "class" && !document.createEvent) { //IE					
                el.className = attributeValue + "IE";
            } else { //Non-IE
                el.setAttribute(attribute, attributeValue);
            }
        }
    }
    parent.appendChild(el);
    return el;
}

    function getMyName() {
        if (localStorage["name"] == null) {
            localStorage["name"] = "Chrome";
        }
        return localStorage["name"];
    }

    function setMyName(name) {
        localStorage["name"] = name;
    }

    function save_options() {
        setChromeNameOption();
        setPortForward();
        var optionsArray = new Array();
        for (var count = 0; count < countExistingOptions; count++) {
            var key = document.getElementById("key" + count);
            var name = document.getElementById("name" + count);
            var combo = document.getElementById("select" + count);
            if (combo.value != null && combo.value != "") {
                key = combo.value;
                name = combo.options[combo.selectedIndex].text;
            } else if (key != null) {
                key = key.value;
                name = name.value;
            }
            var item = {
                command: document.getElementById("command" + count).value,
                commandname: document.getElementById("commandname" + count).value,
                customtext: document.getElementById("customtext" + count).value,
                target: document.getElementById("target" + count).value,
                key: key,
                name: name,
                dontSendText: document.getElementById("dontsendtext" + count).checked,
                sendSelectedFile: document.getElementById("sendselectedfile" + count).checked
            }
            if (item.command != null && item.command != "") {
                optionsArray.push(item);
            }
            //	if(command == null || command.value == "" || command.value == null)break;

            //  localStorage["command" + count] = command.value;
            //  localStorage["commandname" + count] = commandname.value;
            //  localStorage["regId" + count] = key.value;
            //  localStorage["name" + count] = name.value;

        }

        localStorage["items"] = JSON.stringify(optionsArray);

        // Update status to let user know options were saved.
        var status = document.getElementById("status");
        status.innerHTML = "Options Saved.";
        setTimeout(function() {
            status.innerHTML = "";
        }, 750);
        chrome.extension.getBackgroundPage().updatemenu();
        chrome.extension.getBackgroundPage().saveSettingsToSync();
    }
var countExistingOptions = 0;

async function restore_options() {
    countExistingOptions = 0;
    var outterContainer = document.getElementById("optionsContainer");
    outterContainer.innerHTML = '';
    var storedOptions = localStorage["items"];
    restoreShowNotificationsOption();
    restoreShowNotificationsSystemOption();
    restoreShowNotificationsActionsOption();
    restoreAutoHideNotificationsOption();
    restoreAutoHideNotificationsReceivedOption();
    restoreChromeNameOption();
    restorePortForward();
    restoreRedirectAllMessagesOption();
    restoreSendCortanaCommandsOption();
    restoreCloseCortanaCommandsOption();
    if (storedOptions != null) {
        var optionsArray = JSON.parse(localStorage["items"]);
        for (var i = 0; i < optionsArray.length; i++) {
            var item = optionsArray[i];
            createOptionsEntry(null, i);
            var command = document.getElementById("command" + i);
            var commandname = document.getElementById("commandname" + i);
            var customtext = document.getElementById("customtext" + i);
            var key = document.getElementById("key" + i);
            var name = document.getElementById("name" + i);
            var select = document.getElementById("select" + i);
            var dontSendText = document.getElementById("dontsendtext" + i);
            var sendSelectedFile = document.getElementById("sendselectedfile" + i);
            var container = document.getElementById("container" + i);
            var nameAndKeycontainer = document.getElementById("nameAndKeycontainer" + i);
            var target = document.getElementById("target" + i);


            command.value = item.command;
            commandname.value = item.commandname;
            if (item.customtext) customtext.value = item.customtext;
            if (item.target) target.value = item.target;
            key.value = item.key;
            name.value = item.name;
            select.value = item.key;
            if (select.value == item.key && nameAndKeycontainer != null) {
                container.removeChild(nameAndKeycontainer);
            }
            dontSendText.checked = item.dontSendText;
            sendSelectedFile.checked = item.sendSelectedFile;
        }
    }
    var outterDevicesContainer = document.getElementById("optionsDevicesContainer");
    outterDevicesContainer.innerHTML = '';
    var existingDevices = getExistingDevices();
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        await createDevice(null, device.name, device.url, device.key, device.password);
    }

}

function hideElement(el) {
    el.style.display = "none"
}

function doForDevices(action) {
    var existingDevices = getExistingDevices();
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        action(device);
    }
}

function getExistingDevices() {
    return chrome.extension.getBackgroundPage().getExistingDevices();
}

function setExistingDevices(devices) {
    chrome.extension.getBackgroundPage().setExistingDevices(devices);
}

function addDevice(deviceName, deviceUrl, deviceKey, devicePassword) {
    var devices = getExistingDevices();
    device = {
        name: deviceName,
        url: deviceUrl,
        key: deviceKey,
        password: devicePassword
    };
    devices.push(device);
    setExistingDevices(devices);
    save_restore_options();
}

function deviceExists(deviceUrl) {
    var existingDevices = getExistingDevices();
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        if (device.url == deviceUrl) {
            return true;
        }
    }
    return false;
}

function deleteDevice(deviceKey) {
    var existingDevices = getExistingDevices();
    var positionToDelete = -1;
    for (var i = 0; i < existingDevices.length; i++) {
        var device = existingDevices[i];
        if (device.key == deviceKey) {
            positionToDelete = i;
            break;
        }
    }
    if (positionToDelete >= 0) {
        existingDevices.splice(i, 1);
    }
    setExistingDevices(existingDevices);
    save_restore_options();
}

async function createDevice(event, deviceName, deviceUrl, deviceKey, devicePassword) {
    //name
    var nameTextBox = document.getElementById("deviceName");
    var urlTextBox = document.getElementById("deviceUrl");
    var passwordTextBox = document.getElementById("devicePassword");

    var nameValue = deviceName == null ? nameTextBox.value : deviceName;
    var urlValue = deviceUrl == null ? urlTextBox.value : deviceUrl;
    var passwordValue = devicePassword == null ? passwordTextBox.value : devicePassword;
    var keyValue = deviceKey;
    /*if (urlValue.indexOf("goo.gl/") < 0) {
        urlValue = "goo.gl/" + urlValue;
    }
    if (urlValue.indexOf("http") < 0) {
        urlValue = "https://" + urlValue;
    }*/
    if (keyValue != null || !deviceExists(urlValue)) {
        var outterContainer = document.getElementById("optionsDevicesContainer");
        var container = document.createElement("div");

        var nameLabel = document.createTextNode("Device Name:");
        var deviceInList = document.createElement('div');
        var nameValueText = document.createTextNode(nameValue);
        var urlValueText = document.createTextNode(urlValue);
        deviceInList.appendChild(nameValueText);
        deviceInList.appendChild(document.createTextNode(' - '));
        deviceInList.appendChild(urlValueText);
        container.appendChild(deviceInList);
        outterContainer.appendChild(container);

        if (keyValue == null) {
            try{
                const longUrl = await URLShortener.expand(urlValue);
                if (longUrl) {
                    deviceInList.appendChild(document.createTextNode(' : OK : '));
                    container.setAttribute('class', 'okdevice');
                    keyValue = gup(longUrl, "key");
                    addDevice(nameValue, urlValue, keyValue, passwordValue);
                    addDeleteDeviceButton(deviceInList, keyValue);
                    addSendCortanaCommandsCheckbox(deviceInList, keyValue);
                //registerOnDevice(keyValue);
                } else {
                    container.setAttribute('class', 'baddevice');
                    deviceInList.appendChild(document.createTextNode(' : Wrong URL : '));
                }
            }catch(error){
                container.setAttribute('class', 'baddevice');
                deviceInList.appendChild(document.createTextNode(' : Error Checking URL : '));
            }
        } else {
            deviceInList.appendChild(document.createTextNode(' : OK : '));
            container.setAttribute('class', 'okdevice');
            addDeleteDeviceButton(deviceInList, keyValue);
            addSendCortanaCommandsCheckbox(deviceInList, keyValue);
            //registerOnDevice(keyValue);
        }
    } else {
        alert("Device already exists");
    }
}

function addDeleteDeviceButton(container, keyValue) {
    //delete button
    var deleteButtonLabel = document.createTextNode("Delete");
    var buttonDelete = document.createElement('button');
    buttonDelete.onclick = function() {
        deleteDevice(keyValue);
    }
    buttonDelete.appendChild(deleteButtonLabel);
    container.appendChild(buttonDelete);
}
function addSendCortanaCommandsCheckbox(container, keyValue) {
    //cortana option
    var checkboxLabel = document.createTextNode("Send Cortana commands");
    var checkbox = document.createElement('input');
    checkbox.type="checkbox";
    var checked = getForDevice(keyValue,function(device){
        return device.cortana;
    });
    checkbox.checked = checked;
    checkbox.onclick = function(){
        getForDeviceAndSave(keyValue, function(device){            
                console.log("Checked cortana for " + device.name + ": " + checkbox.checked);
                device.cortana = checkbox.checked;
        });
    }
    container.appendChild(document.createElement('br'));
    container.appendChild(checkbox);
    container.appendChild(checkboxLabel);
    container.appendChild(document.createElement('br'));
}
function gup(url, name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    if (results == null)
        return "";
    else
        return results[1];
}

function save_restore_options() {
    save_options();
    restore_options();
}

function restoreShowNotificationsOption() {
    var checkBoxShowNotifications = document.getElementById('checkBoxShowNotifications');
    checkBoxShowNotifications.checked = localStorage["showNotifications"] == null || localStorage["showNotifications"] == "true";
}

function setShowNotificationsOption() {
    var checkBoxShowNotifications = document.getElementById('checkBoxShowNotifications');
    localStorage["showNotifications"] = checkBoxShowNotifications.checked;
}

function restoreShowNotificationsSystemOption() {
    var checkBoxShowNotifications = document.getElementById('checkBoxShowNotificationsSystem');
    checkBoxShowNotifications.checked = localStorage["showNotificationsSystem"] == null || localStorage["showNotificationsSystem"] == "true";
}

function setShowNotificationsSystemOption() {
    var checkBoxShowNotifications = document.getElementById('checkBoxShowNotificationsSystem');
    localStorage["showNotificationsSystem"] = checkBoxShowNotifications.checked;
}

function restoreShowNotificationsActionsOption() {
    var checkBoxShowNotifications = document.getElementById('checkBoxShowNotificationsActions');
    checkBoxShowNotifications.checked = localStorage["showNotificationsActions"] == null || localStorage["showNotificationsActions"] == "true";
}

function setShowNotificationsActionsOption() {
    var checkBoxShowNotifications = document.getElementById('checkBoxShowNotificationsActions');
    localStorage["showNotificationsActions"] = checkBoxShowNotifications.checked;
}

function restoreAutoHideNotificationsOption() {
    var checkBox = document.getElementById('checkBoxAutoHideNotifications');
    checkBox.checked = localStorage["autoHideNotifications"] == "true";
}

function setAutoHideNotificationsOption() {
    var checkBox = document.getElementById('checkBoxAutoHideNotifications');
    localStorage["autoHideNotifications"] = checkBox.checked;
}

function restoreAutoHideNotificationsReceivedOption() {
    var checkBox = document.getElementById('checkBoxAutoHideNotificationsReceived');
    checkBox.checked = localStorage["autoHideNotificationsReceived"] == "true";
}

function setAutoHideNotificationsReceivedOption() {
    var checkBox = document.getElementById('checkBoxAutoHideNotificationsReceived');
    localStorage["autoHideNotificationsReceived"] = checkBox.checked;
}

function restoreRedirectAllMessagesOption() {
    var checkBox = document.getElementById('checkBoxRedirectAllMessages');
    checkBox.checked = localStorage["redirectAllMessages"] == "true";
}

function setRedirectAllMessagesOption() {
    var checkBox = document.getElementById('checkBoxRedirectAllMessages');
    localStorage["redirectAllMessages"] = checkBox.checked;
}

function restoreSendCortanaCommandsOption() {
    var checkBox = document.getElementById('checkBoxSendCortanaCommands');
    checkBox.checked = localStorage["sendCortanaCommands"] == "true";
}
function setSendCortanaCommandsOption() {
    var checkBox = document.getElementById('checkBoxSendCortanaCommands');
    localStorage["sendCortanaCommands"] = checkBox.checked;
}

function restoreCloseCortanaCommandsOption() {
    var checkBox = document.getElementById('checkBoxCloseCortanaCommands');
    checkBox.checked = localStorage["closeCortanaCommands"] == "true";
}
function setCloseCortanaCommandsOption() {
    var checkBox = document.getElementById('checkBoxCloseCortanaCommands');
    localStorage["closeCortanaCommands"] = checkBox.checked;
}

function restorePortForward() {
    var textBox = document.getElementById('textBoxRedirectPort');
    var storedPort = localStorage["redirectPort"];
    if (storedPort != null) {
        textBox.value = storedPort;
    }
}

function setPortForward() {
    var textBox = document.getElementById('textBoxRedirectPort');
    localStorage["redirectPort"] = textBox.value;
}

function restoreChromeNameOption() {
    //var nameTextBox = document.getElementById('chromeName');
    //nameTextBox.value = getMyName();
}

function setChromeNameOption() {
    //var nameTextBox = document.getElementById('chromeName').value;
    //setMyName(nameTextBox);
}

function registerOnDevice(regId) {
    chrome.extension.getBackgroundPage().getForDevice(regId, chrome.extension.getBackgroundPage().registerOnDevice);
}

function getForDevice(regId,func){
    return  chrome.extension.getBackgroundPage().getForDevice(regId, func);
}
function getForDeviceAndSave(regId,func){
    return  chrome.extension.getBackgroundPage().getForDeviceAndSave(regId, func);
}

function registerAllDevices() {
    doForDevices(chrome.extension.getBackgroundPage().registerOnDevice);
}
function registerAllDevices() {
    doForDevices(chrome.extension.getBackgroundPage().registerOnDevice);
}

function testMessage() {
    var payload = document.getElementById('testMessage').value;
    var contents = null;
    if(payload.indexOf("{") < 0){
        contents = {"message" : payload};
    }else{
        contents = {"request" : payload};
    }
    var data = {
        "data": contents
    };
    chrome.extension.getBackgroundPage().handleMessage(data);
}

function exportCommands() {
    prompt("Copy the text below and import it in another Chrome Browser", localStorage["items"]);
}

function importCommands() {
    var text = prompt("Paste the exported text here");
    if (text != null) {
        localStorage["items"] = text;
    }
    restore_options();
}
document.addEventListener('DOMContentLoaded', async function() {
    await restore_options();
    document.getElementById('buttonSave').addEventListener('click', save_restore_options);
    document.getElementById('buttonSave1').addEventListener('click', save_restore_options);
    document.getElementById('buttonSave2').addEventListener('click', save_restore_options);
    document.getElementById('buttonAdd').addEventListener('click', createOptionsEntry);
    document.getElementById('buttonAddDevice').addEventListener('click', createDevice);
    document.getElementById('buttonRefreshRegistrations').addEventListener('click', registerAllDevices);
    document.getElementById('checkBoxShowNotifications').addEventListener('click', setShowNotificationsOption);
    document.getElementById('checkBoxShowNotificationsSystem').addEventListener('click', setShowNotificationsSystemOption);
    document.getElementById('checkBoxShowNotificationsActions').addEventListener('click', setShowNotificationsActionsOption);
    document.getElementById('checkBoxAutoHideNotifications').addEventListener('click', setAutoHideNotificationsOption);
    document.getElementById('checkBoxAutoHideNotificationsReceived').addEventListener('click', setAutoHideNotificationsReceivedOption);
    document.getElementById('textBoxRedirectPort').addEventListener('onkeyup', setPortForward);
    document.getElementById('checkBoxRedirectAllMessages').addEventListener('click', setRedirectAllMessagesOption);
    document.getElementById('checkBoxSendCortanaCommands').addEventListener('click', setSendCortanaCommandsOption);
    document.getElementById('checkBoxCloseCortanaCommands').addEventListener('click', setCloseCortanaCommandsOption);
    document.getElementById('buttonTest').addEventListener('click', testMessage);
    setPersonalUrl();
});

function setPersonalUrl(){
    chrome.extension.getBackgroundPage().getMyUrl(function(url) {
        var personalUrlEl = document.getElementById('personalUrl');
        var personalUrlExplanationEl = document.getElementById('personalUrlExplanation');
        personalUrlExplanationEl.style.display = "block";
        personalUrlEl.setAttribute("href", url);
        personalUrlEl.innerHTML = url;
        chrome.extension.getBackgroundPage().getMyQrCode(function(myQrCode) {
            var personalUrlSection = document.getElementById('personalUrlSection');
            if (myQrCode != null) {
                createElement(personalUrlSection, "img", "personalQr", {
                    "src": myQrCode
                });
            } else {
                var divNoQr = createElement(personalUrlSection, "H1", "personalQr", {
                    "style": "font-family:arial;color:red;font-size:40px;"
                });
                var textNoQr = document.createTextNode("Error getting personal key. Refresh this page to try again. Please contact the developer is the problem persists.");
                divNoQr.appendChild(textNoQr);
            }
            var id = chrome.extension.getBackgroundPage().getIdFromLocalStorage();
            var idGcm = chrome.extension.getBackgroundPage().getIdGCMFromLocalStorage();
            if(idGcm != null && id != idGcm){
                var divGetUniqueURl = createElement(personalUrlSection, "div", "uniqueUrlSection",{
                    "style": "font-family:arial;color:darkyellow;font-size:20px;border:1px solid black;padding:15px;"
                });
                divGetUniqueURl.appendChild(document.createTextNode("AutoRemote Chrome Extension now supports different personal URLs on different PCs for the same account."));
                createElement(divGetUniqueURl, "br");
                divGetUniqueURl.appendChild(document.createTextNode("You can still keep your old URL in one of your browsers (normally your main browser so your current Tasks still work).Click below to give this PC a unique personal URL."));
                createElement(divGetUniqueURl, "br");
                divGetUniqueURl.appendChild(document.createTextNode("Click below to give this PC a unique personal URL."));
                createElement(divGetUniqueURl, "br");
                var buttonGetUniqueUrl = createElement(divGetUniqueURl, "input", "buttonGetUniqueUrl", {"type":"button","value":"Get Unique URL","style":"margin:25px;font-size:20px;"});
                buttonGetUniqueUrl.onclick = function(){
                    chrome.extension.getBackgroundPage().getUniqueUrl(function(){
                        alert("Ok, you now have a unique personal URL!");
                        window.location.reload();
                    });
                }
            }
        });
    });
}
function createOptionsEntry(evt, i) {
    if (!i) {
        i = countExistingOptions;
    }
    var outterContainer = document.getElementById("optionsContainer");
    var container = document.createElement("div");
    container.setAttribute('id', 'container' + i);
    container.setAttribute('class', 'rule');
    var nameAndKeycontainer = document.createElement("span");
    nameAndKeycontainer.setAttribute('id', 'nameAndKeycontainer' + i);

    var ruleTitle = document.createElement('h3');
    var ruleTitleText = document.createTextNode("Command " + (i + 1));
    ruleTitle.appendChild(ruleTitleText);
    container.appendChild(ruleTitle);

    //device
    var deviceLabel = document.createTextNode("Device:");
    var selectDevice = document.createElement("select");
    selectDevice.setAttribute('id', 'select' + i);
    doForDevices(function(device) {
        var deviceOption = document.createElement("option");
        deviceOption.text = device.name;
        deviceOption.value = device.key;
        selectDevice.add(deviceOption);
    });
    container.appendChild(deviceLabel);
    container.appendChild(selectDevice);

    //name
    var nameLabel = document.createTextNode("Device Name:");
    var nameInput = document.createElement('input');
    nameInput.setAttribute('id', 'name' + i);
    nameInput.setAttribute('type', 'text');
    nameAndKeycontainer.appendChild(nameLabel);
    nameAndKeycontainer.appendChild(nameInput);


    //key
    var keyLabel = document.createTextNode("Device Key:");
    var keyInput = document.createElement('input');
    keyInput.setAttribute('id', 'key' + i);
    keyInput.setAttribute('type', 'text');
    nameAndKeycontainer.appendChild(keyLabel);
    nameAndKeycontainer.appendChild(keyInput);

    if (evt == null) {
        container.appendChild(nameAndKeycontainer);
    }

    //commandname
    var commandnameLabel = document.createTextNode("Command Name:");
    var commandnameInput = document.createElement('input');
    commandnameInput.setAttribute('id', 'commandname' + i);
    commandnameInput.setAttribute('type', 'text');
    container.appendChild(commandnameLabel);
    container.appendChild(commandnameInput);

    //Custom text
    var customtextLabel = document.createTextNode("Custom Text:");
    var customtextInput = document.createElement('input');
    customtextInput.setAttribute('id', 'customtext' + i);
    customtextInput.setAttribute('type', 'text');
    container.appendChild(customtextLabel);
    container.appendChild(customtextInput);

    //command
    var commandLabel = document.createTextNode("Command:");
    var commandInput = document.createElement('input');
    commandInput.setAttribute('id', 'command' + i);
    commandInput.setAttribute('type', 'text');
    container.appendChild(commandLabel);
    container.appendChild(commandInput);


    //target
    var targetLabel = document.createTextNode("Target:");
    var targetInput = document.createElement('input');
    targetInput.setAttribute('id', 'target' + i);
    targetInput.setAttribute('type', 'text');
    container.appendChild(targetLabel);
    container.appendChild(targetInput);
    container.appendChild(document.createElement('br'));

    //checkbox
    var commandLabel = document.createTextNode("Don't send right-click selection with this command");
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "name";
    checkbox.id = "dontsendtext" + i;
    container.appendChild(checkbox);
    container.appendChild(commandLabel);

    //checkbox attach file
    var commandLabel = document.createTextNode("Send selected file with this command");
    var checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.name = "name";
    checkbox.id = "sendselectedfile" + i;
    container.appendChild(checkbox);
    container.appendChild(commandLabel);

    //delete button
    var deleteButtonLabel = document.createTextNode("Delete");
    var buttonDelete = document.createElement('button');
    buttonDelete.onclick = function() {
        commandInput.value = "";
        save_options();
        restore_options();
    }
    buttonDelete.appendChild(deleteButtonLabel);
    container.appendChild(buttonDelete);

    container.appendChild(document.createElement('br'));



    //space
    container.appendChild(document.createElement('br'));

    outterContainer.appendChild(container);
    countExistingOptions++;
}
