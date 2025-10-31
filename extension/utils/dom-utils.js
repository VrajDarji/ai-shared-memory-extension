// DOM manipulation utilities for interacting with chat interfaces

function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0;
}

function findSendButton() {
    const sendButtonSelectors = [
        // Gemini
        'button[data-testid="send-button"]',
        'button[aria-label*="send" i]',
        'button[aria-label*="submit" i]',

        // ChatGPT
        'button[data-testid="send-button"]',
        'button[aria-label="Send message"]',

        // Claude
        'button[type="submit"]',
        'button[aria-label*="send" i]',

        // Generic patterns
        'button:has(svg[data-testid*="send"])',
        'button:has(svg[aria-label*="send"])',
        'button[class*="send"]',
        'button[class*="submit"]',

        // Icon-based detection
        'button svg[data-testid*="send"]',
        'button svg[aria-label*="send"]',

        // Text-based detection
        'button:contains("Send")',
        'button:contains("Submit")',

        // Fallback - any button near the input
        'button[type="button"]'
    ];

    for (const selector of sendButtonSelectors) {
        try {
            const button = document.querySelector(selector);
            if (button && isVisible(button)) {
                return button;
            }
        } catch (e) {
            continue;
        }
    }

    const inputElement = document.querySelector('textarea, input[type="text"]');
    if (inputElement) {
        const parent = inputElement.closest('form, div, section');
        if (parent) {
            const buttons = parent.querySelectorAll('button');
            for (const button of buttons) {
                if (isVisible(button) && button.textContent.toLowerCase().includes('send')) {
                    return button;
                }
            }
        }
    }

    return null;
}

function showContextNotification(count, message = null) {
    const existing = document.getElementById('sabkisoch-notification');
    if (existing) existing.remove();

    const notificationText = message || `Loaded ${count} conversations into memory`;
    const subtitleText = message ? 'Context sent to AI automatically' : 'Context is now available for AI to reference';

    const notification = document.createElement('div');
    notification.id = 'sabkisoch-notification';

    const notificationContent = document.createElement('div');
    Object.assign(notificationContent.style, {
        position: 'fixed',
        top: '32px',
        right: '32px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        color: '#1a1a1a',
        padding: '16px 20px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: '1.5px solid #e5e5e5',
        zIndex: '10000',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: '320px',
        minWidth: '280px'
    });

    notificationContent.addEventListener('mouseenter', () => {
        notificationContent.style.transform = 'scale(1.02) translateY(-2px)';
        notificationContent.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.16)';
        notificationContent.style.borderColor = '#d0d0d0';
    });

    notificationContent.addEventListener('mouseleave', () => {
        notificationContent.style.transform = 'scale(1) translateY(0)';
        notificationContent.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
        notificationContent.style.borderColor = '#e5e5e5';
    });

    const mainText = document.createElement('div');
    mainText.textContent = `🧠 ${notificationText}`;
    Object.assign(mainText.style, {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '4px'
    });

    const subtitle = document.createElement('div');
    subtitle.textContent = subtitleText;
    Object.assign(subtitle.style, {
        fontSize: '12px',
        color: '#666',
        fontWeight: '400',
        opacity: '0.8'
    });

    notificationContent.appendChild(mainText);
    notificationContent.appendChild(subtitle);
    notification.appendChild(notificationContent);

    notification.addEventListener('click', () => {
        notificationContent.style.transform = 'translateX(100%)';
        notificationContent.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notificationContent.style.transform = 'translateX(100%)';
            notificationContent.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Format context for append (simple version)
function formatContextForAppend(context) {
    if (!context || context.length === 0) return '';

    const totalConversations = context.length;

    let formattedContext = `Context from ${totalConversations} previous conversations:\n\n`;

    context.forEach((item, index) => {
        const text = item.text || '';

        // Include first 200 characters of each conversation
        const shortText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;
        formattedContext += `${index + 1}. ${shortText}\n\n`;
    });

    formattedContext += `Please reference this context in your response.\n\n`;

    return formattedContext;
}

function injectContextIntoAI() {
    if (!window.__SABKI_SOCH_CONTEXT__ || window.__SABKI_SOCH_CONTEXT__.length === 0) {
        showContextNotification(0, 'No context available - store some conversations first');
        return;
    }

    const inputSelectors = [
        'div[contenteditable="true"]',                 // Some platforms use div
        'div#prompt-textarea[contenteditable="true"]', // ChatGPT specific prompt area
        'div.ProseMirror[contenteditable="true"]',     // ChatGPT ProseMirror editor
        'div[data-virtualkeyboard="true"]',           // ChatGPT virtual keyboard
        'textarea[placeholder*="message" i]',           // Gemini
        'textarea[placeholder*="ask" i]',              // ChatGPT
        'textarea[placeholder*="prompt" i]',           // Claude
        'textarea[data-testid*="textbox"]',            // Generic
        'textarea',                                    // Fallback to any textarea
        'input[type="text"]',
        'prompt-textarea'                           // Fallback to text input
    ];

    let inputElement = null;
    for (const selector of inputSelectors) {
        inputElement = document.querySelector(selector);
        if (inputElement) {
            break;
        }
    }

    if (!inputElement) {
        showContextNotification(0, 'No chat input found');
        return;
    }

    const contextText = formatContextForAppend(window.__SABKI_SOCH_CONTEXT__);

    if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = contextText;
    } else {
        if (inputElement.contentEditable === 'true') {
            inputElement.innerHTML = '';

            const pTag = document.createElement('p');
            pTag.textContent = contextText;
            inputElement.appendChild(pTag);

            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(pTag);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            inputElement.textContent = contextText;
        }
    }

    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

    inputElement.focus();

    showContextNotification(window.__SABKI_SOCH_CONTEXT__.length, 'Context loaded - will auto-send in 1 second');
}

