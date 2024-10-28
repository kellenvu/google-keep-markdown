const activeNoteSelector = '[contenteditable="true"], .markdown-active';
const GOOGLE_KEEP_URL_PATTERN = /https:\/\/keep\.google\.com\/(?:u\/0\/)?/g;


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

function updatePage(markdownActive) {

    observer.disconnect();

    const textBoxes = document.querySelectorAll(activeNoteSelector);

    Array.from(textBoxes)
        .filter(textBox => !isTitle(textBox) && !isCheckbox(textBox))
        .forEach(textBox => {
            updateMarkdownButton(textBox, markdownActive);
            updateTextBox(textBox, markdownActive);
        });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

function updateTextBox(textBox, markdownActive) {

    if (markdownActive && !textBox.classList.contains('markdown-active')) {
        textBox.classList.add('markdown-active');
        textBox.dataset.originalHtml = textBox.innerHTML;
		var parsedContent = marked.parse(textBox.innerText.replaceAll(']( ', ']('));
        textBox.innerHTML = parsedContent.replace(GOOGLE_KEEP_URL_PATTERN, '');
        textBox.contentEditable = 'false';
    }

    if (!markdownActive && textBox.classList.contains('markdown-active')) {

        if (textBox.dataset.originalHtml) {
            textBox.innerHTML = textBox.dataset.originalHtml;
        }

        textBox.contentEditable = 'true';
        textBox.classList.remove('markdown-active');
    }
}

function updateMarkdownButton(elem, markdownActive) {

    let toolbar = elem.parentElement?.parentElement?.nextElementSibling?.querySelector('[role="toolbar"]');
    if (!toolbar) {
        return;
    }

    let markdownButton = toolbar.querySelector('.markdown-button-active, .markdown-button-inactive');
    if (!markdownButton) {
        createMarkdownButton(toolbar, markdownActive);
        return;
    }

    markdownButton.classList.remove(markdownActive ? 'markdown-button-inactive' : 'markdown-button-active');
    markdownButton.classList.add(markdownActive ? 'markdown-button-active' : 'markdown-button-inactive');
}

function createMarkdownButton(toolbar, markdownActive) {

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
    return elem.parentElement?.nextElementSibling?.querySelector('[contentEditable="true"], .markdown-active') ||
        elem.nextElementSibling?.querySelector('[contentEditable="true"], .markdown-active')
}

function isCheckbox(elem) {
    return elem.nextElementSibling?.querySelector('[role="button"]')
}

function injectCSS() {

    let styleSheet = document.createElement('style');

    styleSheet.innerText = `
        .markdown-button-active {
            background-image: url('${chrome.runtime.getURL('assets/active-48.png')}') !important;
            background-size: 15px;
        }
        
        .markdown-button-inactive {
            background-image: url('${chrome.runtime.getURL('assets/inactive-48.png')}') !important;
            background-size: 15px;
        }
    `;

    document.head.appendChild(styleSheet);
}
