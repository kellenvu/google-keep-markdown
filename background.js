chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['markdownActive'], function (result) {
        let markdownActive = result.markdownActive || false;
        updateIcon(markdownActive);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['markdownActive'], function (result) {
        let markdownActive = result.markdownActive || false;
        updateIcon(markdownActive);
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
        "16": "assets/markdown-on-16.png",
        "32": "assets/markdown-on-32.png",
        "48": "assets/markdown-on-48.png",
        "128": "assets/markdown-on-128.png"
    } : {
        "16": "assets/markdown-off-16.png",
        "32": "assets/markdown-off-32.png",
        "48": "assets/markdown-off-48.png",
        "128": "assets/markdown-off-128.png"
    };
    chrome.action.setIcon({
        path: iconPath,
    });
}
