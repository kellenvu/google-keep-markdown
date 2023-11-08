const activeNoteSelector = '[contenteditable="true"]:not([aria-label]), .markdown-active, .markdown-active-title';

window.onload = function () {
    chrome.storage.local.get(['markdownActive'], result => {
        updatePreview(result.markdownActive);
    });
};

chrome.runtime.onMessage.addListener(request => {
    if (request.command === 'updatePreview') {
        updatePreview(request.markdownActive);
    }
});

const observer = new MutationObserver(mutations => {

    const newActiveNote = mutations.some(mutation => {
        Array.from(mutation.addedNodes).some(node => {
            node.nodeType === Node.ELEMENT_NODE && (node.matches(activeNoteSelector) || node.querySelector(activeNoteSelector))
        })
    });

    chrome.storage.local.get(['markdownActive'], result => {
        if (result.markdownActive && newActiveNote) {
            setTimeout(updatePreview, 100, true);
        }
    });
});

function renderMarkdownToHtml(markdownText) {
    return marked.parse(markdownText);
}

function updatePreview(markdownActive) {

    const textBoxes = document.querySelectorAll(activeNoteSelector);

    textBoxes.forEach(textBox => {

        if (markdownActive) {

            if (isTitle(textBox)) {
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
}

function isTitle(elem) {

    let parent = elem.parentElement;
    if (!parent) {
        return false;
    }

    let uncle = parent.nextElementSibling;
    if (!uncle) {
        return false;
    }

    return uncle.firstElementChild && uncle.firstElementChild.contentEditable === 'true';
}
