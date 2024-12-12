chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['markdownActive'], result => {
        updateIcon(result.markdownActive);
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['markdownActive'], result => {
        updateIcon(result.markdownActive);
    });
});

chrome.runtime.onMessage.addListener(request => {
    if (request.command === "triggerAction") {
        triggerAction();
    }
});

chrome.action.onClicked.addListener(triggerAction);

/**
 * Updates the browser action icon based on the current markdown state.
 * 
 * @param {boolean} markdownActive - Indicates whether markdown mode is active.
 *        If true, the icon changes to the "active" icon set; otherwise, it changes to the "inactive" icon set.
 */
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

/**
 * Toggles the markdown state across all relevant tabs, updates the icon, 
 * and synchronizes the state in Chrome's local storage.
 */
function triggerAction() {
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
                        command: 'updatePage',
                        markdownActive: markdownActive,
                    }).catch(error => {
                        console.error(`Error sending message to tab ${tab.id}:`, error);
                    });
                }
            });
        });
    });
}
