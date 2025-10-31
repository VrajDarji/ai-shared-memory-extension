// Scraping utilities for extracting conversation content from web pages

function isUIElement(element) {
    const tagName = element.tagName?.toLowerCase();
    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';

    const uiTags = ['nav', 'header', 'footer', 'aside', 'button', 'input', 'select'];
    const uiClasses = ['nav', 'header', 'footer', 'sidebar', 'menu', 'toolbar', 'button', 'btn', 'cta', 'ad', 'promo'];
    const uiIds = ['nav', 'header', 'footer', 'sidebar', 'menu', 'toolbar', 'button', 'btn', 'cta', 'ad', 'promo'];

    if (uiTags.includes(tagName)) return true;
    if (uiClasses.some(cls => className.includes(cls))) return true;
    if (uiIds.some(idName => id.includes(idName))) return true;

    const rect = element.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 20) return true;

    return false;
}

function extractTextContent(element) {
    const clone = element.cloneNode(true);

    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    const text = clone.textContent?.trim();

    return text?.replace(/\s+/g, ' ').trim();
}

function isValidConversationContent(content) {
    if (!content || content.length < 10) return false;

    if (content.length < 20) return false;

    const uiPatterns = [
        /^(click|tap|press|select|choose|browse|upload|download|save|cancel|submit|send|next|previous|back|home|menu|settings|profile|account|login|logout|sign in|sign up)$/i,
        /^(loading|please wait|error|success|warning|info)$/i,
        /^(yes|no|ok|okay|cancel|confirm|delete|remove|edit|add|create|update)$/i
    ];

    if (uiPatterns.some(pattern => pattern.test(content))) return false;

    const alphaRatio = (content.match(/[a-zA-Z]/g) || []).length / content.length;
    if (alphaRatio < 0.3) return false;

    return true;
}

function scrapeWithFallback() {
    const allTextElements = document.querySelectorAll('p, div, span, article, section');
    const conversations = [];

    allTextElements.forEach(el => {
        if (isUIElement(el)) return;

        const content = extractTextContent(el);
        if (content && isValidConversationContent(content) && content.length > 50) {
            conversations.push(content);
        }
    });

    if (conversations.length === 0) {
        return '';
    }

    const uniqueConversations = [...new Set(conversations)];
    const result = uniqueConversations.slice(0, 10).join('\n\n---\n\n');

    return result.slice(0, 15000);
}

function scrapeVisibleChat() {
    const conversationSelectors = [
        // ChatGPT specific
        '[data-message-author-role="user"]',
        '[data-message-author-role="assistant"]',
        '.group .markdown',
        '.message .message-content',

        // Gemini specific
        '[data-testid="conversation-turn"]',
        '.conversation-turn',
        '.message-content',
        '[role="main"] .message',

        // Claude specific
        '[data-testid="message"]',
        '.message',
        '.conversation-message',

        // Generic conversation patterns
        '[role="article"]',
        '.chat-message',
        '.conversation-item',
        '.message-text',
        '.response-text',
        '.user-message',
        '.assistant-message',

        // Avoid these common UI elements
        'nav', 'header', 'footer', 'aside', 'sidebar',
        '.nav', '.header', '.footer', '.sidebar', '.aside',
        '.menu', '.navigation', '.toolbar', '.controls',
        'button', '.button', '.btn', '.cta',
        '.advertisement', '.ads', '.promo'
    ];

    const conversations = [];
    const processedElements = new Set();

    for (const selector of conversationSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (processedElements.has(el)) return;
                if (isUIElement(el)) return;

                const content = extractTextContent(el);
                if (content && isValidConversationContent(content)) {
                    conversations.push(content);
                    processedElements.add(el);
                }
            });
        } catch (e) {
            continue;
        }
    }

    if (conversations.length === 0) {
        return scrapeWithFallback();
    }

    return conversations.join('\n\n---\n\n');
}

