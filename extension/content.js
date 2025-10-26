// Prevent multiple injections - more robust check
if (window.__SABKI_SOCH_LOADED__) {
    // Don't throw error, just exit silently to prevent conflicts
    throw new Error('Content script already loaded');
}

// Mark as loaded
window.__SABKI_SOCH_LOADED__ = true;

// Use window property to avoid redeclaration errors
if (!window.__SABKI_SOCH_BACKEND_URL__) {
    window.__SABKI_SOCH_BACKEND_URL__ = 'http://localhost:8000';
}
const BACKEND_URL = window.__SABKI_SOCH_BACKEND_URL__;

// Auto-restore context from localStorage (only if not already loaded)
if (!window.__AI_CONTEXT_INJECTED__) {
    restoreContextFromStorage();
}

if (!window.__SABKI_SOCH_UI_INJECTED__) {
    window.__SABKI_SOCH_UI_INJECTED__ = true;

    // Wait for DOM to be ready
    const injectUI = () => {
        try {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('component.js');
            script.onload = () => {
                script.remove();
            };
            script.onerror = (e) => {
                console.error('❌ Failed to load component.js:', e);
            };
            (document.head || document.documentElement).appendChild(script);
        } catch (e) {
            console.error('❌ Error injecting component.js:', e);
        }
    };

    // Inject after a short delay to ensure DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(injectUI, 500);
        });
    } else {
        setTimeout(injectUI, 500);
    }
}

// Inject the injected.js script into the page (only if not already injected)
if (!window.__SABKI_SOCH_INJECTED_LOADED__) {
    try {
        const s = document.createElement('script');
        s.src = chrome.runtime.getURL('injected.js');
        s.onload = () => {
            window.__SABKI_SOCH_INJECTED_LOADED__ = true;
            s.remove();
        }
        s.onerror = (e) => {
            console.error('⚠️ Failed to inject injected.js:', e);
        }
        (document.head || document.documentElement).appendChild(s);
    } catch (e) {
        console.error('⚠️ Error injecting script:', e);
        // If chrome.runtime.getURL fails, try to load from a relative path
        try {
            const s2 = document.createElement('script');
            s2.src = './injected.js'; // Fallback path
            s2.onload = () => {
                window.__SABKI_SOCH_INJECTED_LOADED__ = true;
                s2.remove();
            }
            s2.onerror = (e2) => {
                console.error('⚠️ Failed to load injected.js via fallback:', e2);
            }
            (document.head || document.documentElement).appendChild(s2);
        } catch (e2) {
            console.error('⚠️ All injection methods failed:', e2);
        }
    }
} else {
}

// Listen for messages from injected.js (API data)
window.addEventListener('message', async (event) => {
    if (!event.data || event.data.from !== 'sabki_soch') return;

    try {
        const user_id = await getOrCreateUserId();
        //    Payload to be sent to the backend
        const payload = {
            user_id,
            source: location.hostname,
            text: event.data.payload.data || event.data.payload.text || '',
            url: location.href
        };

        // event.data.payload may contain conversation JSON intercepted
        try {
            chrome.runtime.sendMessage({ action: 'page_api_data', payload });
        } catch (e) {
            // Silently ignore extension context errors
            console.error('⚠️ Extension context unavailable, skipping message');
        }
    } catch (e) {
        console.error('⚠️ Error processing message:', e);
    }
});

// Listen for messages from component.js (floating UI)
window.addEventListener('message', async (event) => {
    if (!event.data || event.data.type !== 'SABKI_SOCH_ACTION') return;


    try {
        if (event.data.action === 'store_context') {
            // Handle store action
            let content = window.__SABKI_SOCH_LAST_API_PAYLOAD__ || scrapeVisibleChat();
            if (!content) {
                console.error('❌ No content to store');
                return;
            }

            const payload = {
                user_id: await getOrCreateUserId(),
                source: location.hostname,
                text: content,
                url: location.href,
            }

            const result = await storeToBackend(payload);

            // Send response back to component.js
            window.postMessage({
                type: 'SABKI_SOCH_RESPONSE',
                action: 'store_context',
                success: result.ok,
                message: result.ok ? 'Chat stored successfully!' : 'Failed to store chat'
            }, '*');

        } else if (event.data.action === 'load_context') {
            // Handle load context action
            const userId = await getOrCreateUserId();

            const result = await fetch(`${BACKEND_URL}/generate_context`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    max_length: 2000
                }),
                credentials: 'omit',
            });

            const data = await result.json();

            if (!data || !data.context || data.context.length === 0) {
                window.postMessage({
                    type: 'SABKI_SOCH_RESPONSE',
                    action: 'load_context',
                    success: false,
                    message: 'No conversations found to generate context from'
                }, '*');
                return;
            }

            // Store the generated context
            window.__SABKI_SOCH_CONTEXT__ = [{
                text: data.context,
                metadata: {
                    source: 'generated',
                    summary: data.summary,
                    conversation_count: data.conversation_count,
                    context_length: data.context_length
                }
            }];

            // Auto-inject context and send
            injectContextIntoAI();

            setTimeout(() => {
                const sendButton = findSendButton();
                if (sendButton) {
                    sendButton.click();
                }
            }, 1000);

            window.postMessage({
                type: 'SABKI_SOCH_RESPONSE',
                action: 'load_context',
                success: true,
                message: `Intelligent context generated and sent from ${data.conversation_count} conversations!`
            }, '*');

        } else if (event.data.action === 'inject_context') {
            // Handle inject context action
            if (!window.__SABKI_SOCH_CONTEXT__) {
                // Generate context first
                const userId = await getOrCreateUserId();
                const result = await fetch(`${BACKEND_URL}/generate_context`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        max_length: 2000
                    }),
                    credentials: 'omit',
                });

                const data = await result.json();
                if (data && data.context && data.context.length > 0) {
                    window.__SABKI_SOCH_CONTEXT__ = [{
                        text: data.context,
                        metadata: {
                            source: 'generated',
                            summary: data.summary,
                            conversation_count: data.conversation_count,
                            context_length: data.context_length
                        }
                    }];
                }
            }

            if (window.__SABKI_SOCH_CONTEXT__) {
                injectContextIntoAI();
                window.postMessage({
                    type: 'SABKI_SOCH_RESPONSE',
                    action: 'inject_context',
                    success: true,
                    message: 'Context injected into chat input!'
                }, '*');
            } else {
                window.postMessage({
                    type: 'SABKI_SOCH_RESPONSE',
                    action: 'inject_context',
                    success: false,
                    message: 'No context available to inject'
                }, '*');
            }

        } else if (event.data.action === 'clear_data') {
            // Handle clear data action
            const userId = await getOrCreateUserId();
            const response = await fetch(`http://localhost:8000/clear/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            window.postMessage({
                type: 'SABKI_SOCH_RESPONSE',
                action: 'clear_data',
                success: result.ok,
                message: result.ok ? `Cleared ${result.deleted_count} documents` : 'Failed to clear data'
            }, '*');
        }
    } catch (error) {
        console.error('❌ Error handling component action:', error);
        window.postMessage({
            type: 'SABKI_SOCH_RESPONSE',
            action: event.data.action,
            success: false,
            message: 'Error: ' + error.message
        }, '*');
    }
});


// helper: try to scrape visible message ( fallback )

function scrapeVisibleChat() {

    // More specific selectors for actual conversation content
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

    // First pass: collect conversation elements
    for (const selector of conversationSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Skip if already processed
                if (processedElements.has(el)) return;

                // Skip UI elements
                if (isUIElement(el)) return;

                const content = extractTextContent(el);
                if (content && isValidConversationContent(content)) {
                    conversations.push(content);
                    processedElements.add(el);
                }
            });
        } catch (e) {
            // Skip invalid selectors
            continue;
        }
    }

    // If no specific conversations found, try fallback with better filtering
    if (conversations.length === 0) {
        return scrapeWithFallback();
    }

    return conversations.join('\n\n---\n\n');
}

// Helper function to check if element is UI-related
function isUIElement(element) {
    const tagName = element.tagName?.toLowerCase();
    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';

    // Skip common UI elements
    const uiTags = ['nav', 'header', 'footer', 'aside', 'button', 'input', 'select'];
    const uiClasses = ['nav', 'header', 'footer', 'sidebar', 'menu', 'toolbar', 'button', 'btn', 'cta', 'ad', 'promo'];
    const uiIds = ['nav', 'header', 'footer', 'sidebar', 'menu', 'toolbar', 'button', 'btn', 'cta', 'ad', 'promo'];

    if (uiTags.includes(tagName)) return true;
    if (uiClasses.some(cls => className.includes(cls))) return true;
    if (uiIds.some(idName => id.includes(idName))) return true;

    // Skip very small elements (likely UI)
    const rect = element.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 20) return true;

    return false;
}

// Helper function to extract clean text content
function extractTextContent(element) {
    // Clone element to avoid modifying original
    const clone = element.cloneNode(true);

    // Remove script and style elements
    clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

    // Get text content
    const text = clone.textContent?.trim();

    // Clean up whitespace
    return text?.replace(/\s+/g, ' ').trim();
}

// Helper function to validate if content looks like conversation
function isValidConversationContent(content) {
    if (!content || content.length < 10) return false;

    // Skip very short content
    if (content.length < 20) return false;

    // Skip content that looks like UI text
    const uiPatterns = [
        /^(click|tap|press|select|choose|browse|upload|download|save|cancel|submit|send|next|previous|back|home|menu|settings|profile|account|login|logout|sign in|sign up)$/i,
        /^(loading|please wait|error|success|warning|info)$/i,
        /^(yes|no|ok|okay|cancel|confirm|delete|remove|edit|add|create|update)$/i
    ];

    if (uiPatterns.some(pattern => pattern.test(content))) return false;

    // Skip content that's mostly numbers or symbols
    const alphaRatio = (content.match(/[a-zA-Z]/g) || []).length / content.length;
    if (alphaRatio < 0.3) return false;

    return true;
}

// Fallback scraping with better filtering
function scrapeWithFallback() {

    // Look for any text content that might be conversations
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

    // Remove duplicates and limit length
    const uniqueConversations = [...new Set(conversations)];
    const result = uniqueConversations.slice(0, 10).join('\n\n---\n\n');

    return result.slice(0, 15000); // Limit total length
}


async function storeToBackend(payload) {
    try {
        const res = await fetch(`${BACKEND_URL}/store`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'omit',
        })

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const result = await res.json();
        return result;
    } catch (err) {
        console.error('❌ Error storing to backend:', err);
        return { ok: false, error: String(err) };
    }
}


// Listen for messages from the popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {

    if (request.action === 'store_context') {
        // Respond immediately to prevent port closure
        sendResponse({ ok: true, message: 'Processing...' });

        // Process asynchronously
        (async () => {
            try {
                let content = window.__SABKI_SOCH_LAST_API_PAYLOAD__ || scrapeVisibleChat();
                if (!content) {
                    console.error('❌ No content to store');
                    return;
                }

                const payload = {
                    user_id: await getOrCreateUserId(),
                    source: location.hostname,
                    text: content,
                    url: location.href,
                }

                const result = await storeToBackend(payload);
            } catch (error) {
                console.error('❌ Store operation failed:', error);
            }
        })();

        return true;
    }

    if (request.action === 'load_context') {
        // Respond immediately to prevent port closure
        sendResponse({ ok: true, message: 'Generating intelligent context...' });

        // Process asynchronously
        (async () => {
            try {
                const userId = await getOrCreateUserId();

                // Use the new generate_context endpoint
                const result = await fetch(`${BACKEND_URL}/generate_context`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        max_length: 2000
                    }),
                    credentials: 'omit',
                });

                const data = await result.json();

                if (!data || !data.context || data.context.length === 0) {
                    showContextNotification(0, 'No conversations found to generate context from');
                    return;
                }


                // Store the generated context (not raw conversations)
                window.__SABKI_SOCH_CONTEXT__ = [{
                    text: data.context,
                    metadata: {
                        source: 'generated',
                        summary: data.summary,
                        conversation_count: data.conversation_count,
                        context_length: data.context_length
                    }
                }];

                // Auto-inject context and send
                injectContextIntoAI();

                // Auto-send after a short delay
                setTimeout(() => {
                    const sendButton = findSendButton();
                    if (sendButton) {
                        sendButton.click();
                    } else {
                    }
                }, 1000);

                // Create a subtle notification
                showContextNotification(data.conversation_count, 'Intelligent context generated and sent');

            } catch (error) {
                console.error('❌ Context generation failed:', error);
                showContextNotification(0, 'Failed to generate context');
            }
        })();

        return true;
    }

    if (request.action === 'inject_context') {
        // Respond immediately
        sendResponse({ ok: true, message: 'Injecting context...' });

        // Process asynchronously
        (async () => {
            try {
                if (!window.__SABKI_SOCH_CONTEXT__) {
                    // Generate intelligent context first
                    const userId = await getOrCreateUserId();
                    const result = await fetch(`${BACKEND_URL}/generate_context`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            max_length: 2000
                        }),
                        credentials: 'omit',
                    });

                    const data = await result.json();

                    if (data && data.context && data.context.length > 0) {
                        window.__SABKI_SOCH_CONTEXT__ = [{
                            text: data.context,
                            metadata: {
                                source: 'generated',
                                summary: data.summary,
                                conversation_count: data.conversation_count,
                                context_length: data.context_length
                            }
                        }];
                    } else {
                    }
                }

                if (window.__SABKI_SOCH_CONTEXT__) {
                    injectContextIntoAI();
                } else {
                }
            } catch (error) {
                console.error('❌ Context injection failed:', error);
            }
        })();

        return true;
    }
})

// Cache user ID to prevent multiple generations
let cachedUserId = null;

// Show subtle notification for context loading
function showContextNotification(count, message = null) {
    // Remove existing notification if any
    const existing = document.getElementById('sabkisoch-notification');
    if (existing) existing.remove();

    const notificationText = message || `Loaded ${count} conversations into memory`;
    const subtitleText = message ? 'Context sent to AI automatically' : 'Context is now available for AI to reference';

    // Create notification element using DOM methods (CSP-safe)
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

    // Add hover effects
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

    // Create main text with brain emoji
    const mainText = document.createElement('div');
    mainText.textContent = `🧠 ${notificationText}`;
    Object.assign(mainText.style, {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '4px'
    });

    // Create subtitle
    const subtitle = document.createElement('div');
    subtitle.textContent = subtitleText;
    Object.assign(subtitle.style, {
        fontSize: '12px',
        color: '#666',
        fontWeight: '400',
        opacity: '0.8'
    });

    // Assemble notification
    notificationContent.appendChild(mainText);
    notificationContent.appendChild(subtitle);
    notification.appendChild(notificationContent);

    // Add click handler to dismiss
    notification.addEventListener('click', () => {
        notificationContent.style.transform = 'translateX(100%)';
        notificationContent.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    });

    // Add to page
    document.body.appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notificationContent.style.transform = 'translateX(100%)';
            notificationContent.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Smart context injection - inject context as first message (simple approach)
function injectContextIntoAI() {

    // Get stored context
    if (!window.__SABKI_SOCH_CONTEXT__ || window.__SABKI_SOCH_CONTEXT__.length === 0) {
        showContextNotification(0, 'No context available - store some conversations first');
        return;
    }

    // Find chat input elements
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

    // Format context
    const contextText = formatContextForAppend(window.__SABKI_SOCH_CONTEXT__);

    // Set the context text
    if (inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
        inputElement.value = contextText;
    } else {
        // For contenteditable divs (like ChatGPT), we need to handle p tags
        if (inputElement.contentEditable === 'true') {
            // Clear existing content
            inputElement.innerHTML = '';

            // Create a p tag and set the text
            const pTag = document.createElement('p');
            pTag.textContent = contextText;
            inputElement.appendChild(pTag);

            // Set cursor position to end
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

    // Trigger input events
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));

    // Focus the input
    inputElement.focus();

    showContextNotification(window.__SABKI_SOCH_CONTEXT__.length, 'Context loaded - click send to send');
}

// Removed complex auto injection setup - using simple approach

// Simple context append - no monitoring needed


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

// Find send button across different AI platforms
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
            // Some selectors might not be supported in all browsers
            continue;
        }
    }

    // Fallback: look for buttons near the input
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

// Check if element is visible
function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0;
}


// Auto-restore context from localStorage on page load
function restoreContextFromStorage() {

    // Check if context was previously injected (using localStorage flag)
    const wasInjected = localStorage.getItem('__SABKI_SOCH_CONTEXT_INJECTED__') === 'true';
    const injectedTimestamp = localStorage.getItem('__SABKI_SOCH_CONTEXT_TIMESTAMP__');

    // Don't restore if context is already injected in current session
    if (window.__AI_CONTEXT_INJECTED__) {
        return true;
    }

    // Don't restore if context already exists in memory
    if (window.__SABKI_SOCH_CONTEXT__ && window.__SABKI_SOCH_CONTEXT__.length > 0) {
        window.__AI_CONTEXT_INJECTED__ = true;
        return true;
    }

    try {
        const storedContext = localStorage.getItem('__SABKI_SOCH_AI_CONTEXT__');
        if (storedContext && wasInjected) {
            window.__SABKI_SOCH_CONTEXT__ = JSON.parse(storedContext);
            window.__AI_CONTEXT_INJECTED__ = true;

            return true;
        } else if (storedContext && !wasInjected) {
            localStorage.removeItem('__SABKI_SOCH_AI_CONTEXT__');
        }
    } catch (e) {
        console.error('⚠️ Could not restore context from storage:', e);
    }
    return false;
}

// helper: get or create a user id
function getOrCreateUserId() {
    return new Promise(resolve => {
        // Return cached ID if available
        if (cachedUserId) {
            return resolve(cachedUserId);
        }

        try {
            chrome.storage.local.get(['ai_mem_user_id'], (res) => {
                if (res.ai_mem_user_id) {
                    cachedUserId = res.ai_mem_user_id;
                    return resolve(cachedUserId);
                }

                const id = crypto.randomUUID();
                chrome.storage.local.set({ ai_mem_user_id: id }, () => {
                    cachedUserId = id;
                    resolve(id);
                });
            });
        } catch (e) {
            // Fallback to generating a new ID if chrome storage is unavailable
            const id = crypto.randomUUID();
            cachedUserId = id;
            resolve(id);
        }
    });
}