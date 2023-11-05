chrome.storage.local.get(['markdownActive'], function (result) {
    let markdownActive = result.markdownActive || false;
    updateIcon(markdownActive)
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
    chrome.action.setIcon({ path: iconPath });
}

chrome.runtime.onMessage.addListener(function (request) {
    if (request.command === "updateIcon") {
        updateIcon(request.markdownActive);
    }
});

chrome.action.onClicked.addListener(function () {
    chrome.storage.local.get(['markdownActive'], function (result) {
        let markdownActive = !result.markdownActive;
        updateIcon(markdownActive);
        chrome.storage.local.set({ markdownActive: markdownActive }, function () {
            chrome.tabs.query({ url: "*://keep.google.com/*" }, function (tabs) {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, { command: 'updatePreview', markdownActive: markdownActive })
                        .catch((error) => {
                            console.error(`Error sending message to tab ${tab.id}:`, error);
                        });
                }
            });
        });
    });
});
