chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['markdownActive'], function (result) {s
        updateIcon(result.markdownActive);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['markdownActive'], function (result) {
        updateIcon(result.markdownActive);
    });
});

chrome.runtime.onMessage.addListener(request => {
    if (request.command === "updateIcon") {
        updateIcon(request.markdownActive);
    }
});

chrome.action.onClicked.addListener(() => {
    chrome.storage.local.get(['markdownActive'], result => {

        let markdownActive = !result.markdownActive;

        updateIcon(markdownActive);
        
        chrome.storage.local.set({
            markdownActive: markdownActive
        }, () => {
            chrome.tabs.query({
                url: "*://keep.google.com/*",
            }, tabs => {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, {
                        command: 'updatePreview',
                        markdownActive: markdownActive,
                    }).catch(error => {
                        console.error(`Error sending message to tab ${tab.id}:`, error);
                    });
                }
            });
        });
    });
});

function updateIcon(markdownActive) {
    const iconPath = markdownActive ? {
        "16": "assets/active-16.png",
        "32": "assets/active-32.png",
        "48": "assets/active-48.png",
        "128": "assets/active-128.png"
    } : {
        "16": "assets/inactive-16.png",
        "32": "assets/inactive-32.png",
        "48": "assets/inactive-48.png",
        "128": "assets/inactive-128.png"
    };
    chrome.action.setIcon({
        path: iconPath,
    });
}
