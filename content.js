const activeNoteSelector = '[contenteditable="true"]:not([aria-label]), .markdown-active, .markdown-active-title';

function renderMarkdownToHtml(markdownText) {
    // TODO: Input validation
    return marked.parse(markdownText);
}

function updatePreview(markdownActive) {

    observer.disconnect();

    const textBoxes = document.querySelectorAll(activeNoteSelector);

    textBoxes.forEach((textBox, index) => {

        if (markdownActive) {

            if (index === 1) {
                textBox.classList.add('markdown-active-title');
            }

            textBox.classList.add('markdown-active');
            textBox.dataset.originalHtml = textBox.innerHTML;
            textBox.innerHTML = renderMarkdownToHtml(textBox.innerText);
            textBox.contentEditable = 'false';
        } else {

            if (textBox.dataset.originalHtml) {
                textBox.innerHTML = textBox.dataset.originalHtml;
            }

            textBox.contentEditable = 'true';
            textBox.classList.remove('markdown-active-title');
            textBox.classList.remove('markdown-active');
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

const observer = new MutationObserver(mutations => {

    const newTextBoxDetected = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches(activeNoteSelector) || node.querySelector(activeNoteSelector))
        )
    );

    chrome.storage.local.get(['markdownActive'], function (result) {
        if (result.markdownActive && newTextBoxDetected) {
            setTimeout(updatePreview, 100, true);
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.command === 'updatePreview') {
        updatePreview(request.markdownActive)
    }
});

// Check markdown flag on page startup
chrome.storage.local.get(['markdownActive'], function (result) {
    setTimeout(updatePreview, 1000, result.markdownActive);
});
