
class CrossContext {
    static TYPE_LISTENER = "listener"
    static TYPE_CALLER = "caller"
    static TARGET_OFFSCREEN = "target_offscreen"
    static TARGET_SERVICE_WORKER = "target_service_worker"
    static LISTENER_ID_DEFAULT = "MyListener"
    static #listeners = {}
    static addForegroundListener(call, listener) {
        if (!CrossContext.#listeners[call]) {
            CrossContext.#listeners[call] = [];
        }
        CrossContext.#listeners[call].push(listener);
        const options = {
            call,
            type: "listener"
        };
        chrome.runtime.sendMessage(options)
    }
    static callForegroundListener(call, input = []) {
        const listenersForCall = CrossContext.#listeners[call];
        if (listenersForCall == null) return;

        listenersForCall.forEach(listener => {
            console.log("Calling foreground listener", self, call, listener);
            listener(...input)
        });
    }
    static #getBackgroundFunctionFromCall(call) {
        if (call.indexOf(".") < 0) {
            return self[call];
        }
        const callParts = call.split('.');
        const context = callParts.slice(0, callParts.length - 1).reduce((obj, part) => obj[part], self);
        const functionName = callParts[callParts.length - 1];
        const fun = context[functionName].bind(context);
        return fun;
    }
    static #backgroundListeners = {}
    static addBackgroundListener(call, id = CrossContext.LISTENER_ID_DEFAULT) {
        const listenerFunction = CrossContext.#getBackgroundFunctionFromCall(call);
        if (listenerFunction == null) return;

        const removeListenerFunction = CrossContext.#getBackgroundFunctionFromCall(call.replace("addListener", "removeListener"));

        console.log("Adding background listener", self, call, listenerFunction);
        const finalId = call + id;
        if (removeListenerFunction) {
            const existingListenerWithSameId = CrossContext.#backgroundListeners[finalId];
            if (existingListenerWithSameId) {
                console.log("Removing existing listener with same ID", finalId, existingListenerWithSameId)
                removeListenerFunction(existingListenerWithSameId);
                delete CrossContext.#backgroundListeners[finalId];
            }
        }
        const listener = (...input) => {
            chrome.runtime.sendMessage({ call, type: CrossContext.TYPE_LISTENER, input });
        };
        CrossContext.#backgroundListeners[finalId] = listener
        listenerFunction(listener)
    }
    static listen(call) {
        return (listener => CrossContext.addForegroundListener(call, listener));
    }

    static async callBackgroundFunction(call, input, sendResponse) {
        const fun = CrossContext.#getBackgroundFunctionFromCall(call);
        if (fun == null) return

        console.log("Calling background function", self, call, fun)
        const output = await fun(...input);
        await sendResponse(output);
    }
    static call(call, target = CrossContext.TARGET_SERVICE_WORKER) {
        return (async (...input) => {
            const intputWithoutFunctions = input.filter(i => typeof i !== "function");
            const result = await chrome.runtime.sendMessage({ call, type: CrossContext.TYPE_CALLER, input: intputWithoutFunctions, target });
            const lastArg = input[input.length - 1];
            if (typeof lastArg === 'function') {
                lastArg(result);
            }
            return result;
        });
    }
}
const isServiceWorker = typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope;
const isOffscreenPage = self["isOffscreenPage"];
console.log("Self", self, "Is Service Worker", isServiceWorker, "Is Offscreen Page", isOffscreenPage);
chrome.runtime.onMessage.addListener(({ call, type, input, target }, sender, sendResponse) => {
    if (type == CrossContext.TYPE_LISTENER) {
        if (isServiceWorker) {
            CrossContext.addBackgroundListener(call);
        } else {
            CrossContext.callForegroundListener(call, input);
        }
    }
    if (type == CrossContext.TYPE_CALLER) {
        const rightTarget = (target == CrossContext.TARGET_SERVICE_WORKER && isServiceWorker)
            || (target == CrossContext.TARGET_OFFSCREEN && isOffscreenPage);
        if (rightTarget) {
            (async () => {
                await CrossContext.callBackgroundFunction(call, input, sendResponse);
            })();
            return true;
        }
    }
});
if (!isServiceWorker) {
    chrome.commands = {
        onCommand: {
            addListener: CrossContext.listen("chrome.commands.onCommand.addListener")
        }
    };

    chrome.notifications = {
        onClicked: {
            addListener: CrossContext.listen("chrome.notifications.onClicked.addListener")
        },
        onClosed: {
            addListener: CrossContext.listen("chrome.notifications.onClosed.addListener")
        },
        onButtonClicked: {
            addListener: CrossContext.listen("chrome.notifications.onButtonClicked.addListener")
        },
        clear: CrossContext.call("chrome.notifications.clear"),
        create: CrossContext.call("chrome.notifications.create")
    };

    chrome.contextMenus = {
        removeAll: CrossContext.call("chrome.contextMenus.removeAll"),
        create: CrossContext.call("chrome.contextMenus.create"),
        onClicked: {
            addListener: CrossContext.listen("chrome.contextMenus.onClicked.addListener")
        }
    };

    chrome.storage = {
        sync: {
            get: CrossContext.call("chrome.storage.sync.get"),
            set: CrossContext.call("chrome.storage.sync.set"),
            onChanged: {
                addListener: CrossContext.listen("chrome.storage.sync.onChanged.addListener")
            }
        },
        onChanged: {
            addListener: CrossContext.listen("chrome.storage.onChanged.addListener")
        }
    };

    chrome.gcm = {
        onMessage: {
            addListener: CrossContext.listen("chrome.gcm.onMessage.addListener")
        }
    };

    chrome.instanceID = {
        getToken: CrossContext.call("chrome.instanceID.getToken")
    };

    chrome.tabs = {
        create: CrossContext.call("chrome.tabs.create")
    };

    chrome.windows = {
        update: CrossContext.call("chrome.windows.update")
    };
}

if (isServiceWorker) {
    //needed because otherwise if you do too many requests in a row you'll get an exception
    const originalGetToken = chrome.instanceID.getToken;
    var gcmTokenGetter = null;
    const getFromPending = async () => {
        const token = await gcmTokenGetter;
        console.log("token", token);
        gcmTokenGetter = null;
        return token;
    }
    chrome.instanceID.getToken = async function (...input) {
        if (gcmTokenGetter) {
            console.log("getGCMToken using pending request")
            return await getFromPending();
        }

        console.log("getGCMToken using new request")
        gcmTokenGetter = originalGetToken(...input);
        return await getFromPending();
    }
}