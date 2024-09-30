importScripts("./cross_context.js");
chrome.offscreen.createDocument({
    url: 'autoremote.html',
    reasons: ['CLIPBOARD', 'LOCAL_STORAGE'],
    justification: 'reason for needing the document',
});
