const activeNoteSelector = '[contenteditable="true"]:not([aria-label="list item"]), .markdown-active, .markdown-active-title';

injectCSS();

window.onload = function () {
    chrome.storage.local.get(['markdownActive'], result => {
        updatePage(result.markdownActive);
    });
};

chrome.runtime.onMessage.addListener(request => {
    if (request.command === 'updatePage') {
        updatePage(request.markdownActive);
    }
});

const observer = new MutationObserver(mutations => {

    const newActiveNote = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
            node.nodeType === Node.ELEMENT_NODE && (node.matches(activeNoteSelector) || node.querySelector(activeNoteSelector))
        )
    );

    if (newActiveNote) {
        chrome.storage.local.get(['markdownActive'], result => {
            setTimeout(updatePage, 100, result.markdownActive);
        });
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function renderMarkdownToHtml(markdownText) {
    return marked.parse(markdownText);
}

function updatePage(markdownActive) {

    observer.disconnect();

    const textBoxes = document.querySelectorAll(activeNoteSelector);

    textBoxes.forEach(textBox => {

        updateMarkdownButton(textBox, markdownActive);

        if (markdownActive && !textBox.classList.contains('markdown-active')) {

            if (isTitle(textBox)) {
                textBox.classList.add('markdown-active-title');
            }

            textBox.classList.add('markdown-active');
            textBox.dataset.originalHtml = textBox.innerHTML;
            textBox.innerHTML = renderMarkdownToHtml(textBox.innerText);
            textBox.contentEditable = 'false';
        } else if (!markdownActive && textBox.classList.contains('markdown-active')) {

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
        subtree: true,
    });
}

function updateMarkdownButton(elem, markdownActive) {

    let granduncle = elem.parentElement?.parentElement?.nextElementSibling;
    if (!granduncle) {
        return;
    }

    let toolbar = granduncle.querySelector('[role="toolbar"]');
    if (!toolbar) {
        return;
    }

    let markdownButton = toolbar.querySelector('.markdown-button-active, .markdown-button-inactive');
    if (markdownButton) {
        markdownButton.classList.remove(markdownActive ? 'markdown-button-inactive' : 'markdown-button-active');
        markdownButton.classList.add(markdownActive ? 'markdown-button-active' : 'markdown-button-inactive');
        return;
    }

    let remindMeButton = toolbar.querySelector('[aria-label="Remind me"]');
    if (!remindMeButton) {
        return;
    }

    markdownButton = remindMeButton.cloneNode(true);
    markdownButton.classList.add(markdownActive ? 'markdown-button-active' : 'markdown-button-inactive');

    markdownButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            command: 'triggerAction',
        });
    });

    remindMeButton.parentNode.insertBefore(markdownButton, remindMeButton);
}

function isTitle(elem) {
    let uncle = elem.parentElement?.nextElementSibling;
    return Array.from(uncle?.children || []).some(child => child.contentEditable === 'true');
}

function injectCSS() {

    let active = chrome.runtime.getURL('assets/active-48.png');

    let inactive = chrome.runtime.getURL('assets/inactive-48.png');

    let styleSheet = document.createElement('style');

    styleSheet.innerText = `
        .markdown-button-active {
            background-image: url('${active}') !important;
            background-size: 15px;
        }
        
        .markdown-button-inactive {
            background-image: url('${inactive}') !important;
            background-size: 15px;
        }
    `;

    document.head.appendChild(styleSheet);
}
