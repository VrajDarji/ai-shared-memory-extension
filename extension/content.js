// Prevent multiple injections - more robust check
if (window.__SABKI_SOCH_LOADED__) {
    throw new Error('Content script already loaded');
}

window.__SABKI_SOCH_LOADED__ = true;

if (!window.__SABKI_SOCH_BACKEND_URL__) {
    window.__SABKI_SOCH_BACKEND_URL__ = 'http://localhost:8000';
}
const BACKEND_URL = window.__SABKI_SOCH_BACKEND_URL__;

// Initialize storage and scripts
if (!window.__AI_CONTEXT_INJECTED__) {
    restoreContextFromStorage();
}

initializeScripts();

// Handle messages from injected.js (API call interception)
window.addEventListener('message', async (event) => {
    if (!event.data || event.data.from !== MESSAGE_TYPES.FROM_SABKI_SOCH) return;

    try {
        const user_id = await getOrCreateUserId();
        const payload = {
            user_id,
            source: location.hostname,
            text: event.data.payload.data || event.data.payload.text || '',
            url: location.href
        };
        // If any data found from injected (API Calls) send to background.js
        try {
            chrome.runtime.sendMessage({ action: CHROME_RUNTIME_ACTIONS.PAGE_API_DATA, payload });
        } catch (e) {
            console.error('⚠️ Extension context unavailable, skipping message');
        }
    } catch (e) {
        console.error('⚠️ Error processing message:', e);
    }
});

/**
 * Listen for messages from component.js (Common Message Bus)
 * 
 * Main logic: content.js runs in extension context, component.js runs in page context.
 * This message bus allows communication between them. All major logic is handled in 
 * extension context, while component.js communicates with the page context.
 */

window.addEventListener('message', async (event) => {
    if (!event.data) return;

    try {
        if (event.data.type === MESSAGE_TYPES.GET_USER_ID) {
            const userId = await getOrCreateUserId();
            window.postMessage({
                type: MESSAGE_TYPES.USER_ID_RESPONSE,
                userId: userId
            }, '*');
            return;
        }

        if (event.data.type === MESSAGE_TYPES.GET_CONTEXTS) {
            const userId = await getOrCreateUserId();
            const result = await getAllContexts(userId, BACKEND_URL);

            window.postMessage({
                type: MESSAGE_TYPES.CONTEXTS_RESPONSE,
                success: result.success,
                contexts: result.items || [],
                error: result.error
            }, '*');
            return;
        }

        // Handle ACTION requests
        if (event.data.type !== MESSAGE_TYPES.ACTION) return;

        const { action } = event.data;
        let result;

        switch (action) {
            case ACTIONS.STORE_CONTEXT:
                result = await handleStoreContext(BACKEND_URL);
                break;

            case ACTIONS.LOAD_CONTEXT:
                result = await handleLoadContext(BACKEND_URL, true, false);
                break;

            case ACTIONS.LOAD_CONTEXT_BY_ID:
                result = await handleLoadContextById(
                    event.data.context_id,
                    await getOrCreateUserId(),
                    BACKEND_URL,
                    true
                );
                break;

            case ACTIONS.CLEAR_DATA:
                result = await handleClearData(await getOrCreateUserId(), BACKEND_URL);
                break;

            default:
                result = { success: false, message: `Unknown action: ${action}` };
        }

        window.postMessage({
            type: MESSAGE_TYPES.RESPONSE,
            action: action,
            success: result.success,
            message: result.message
        }, '*');

    } catch (error) {
        console.error('❌ Error handling component action:', error);
        window.postMessage({
            type: MESSAGE_TYPES.RESPONSE,
            action: event.data?.action || 'unknown',
            success: false,
            message: 'Error: ' + error.message
        }, '*');
    }
});


// Handle messages from popup.js (extension context)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    try {
        if (request.type === MESSAGE_TYPES.GET_CONTEXTS) {
            const userId = await getOrCreateUserId();
            const result = await getAllContexts(userId, BACKEND_URL);

            sendResponse({
                success: result.success,
                contexts: result.items || [],
                error: result.error
            });
            return true;
        }

        // Handle action requests (async operations)
        if (request.action) {
            const loadingMessages = {
                [ACTIONS.STORE_CONTEXT]: 'Processing...',
                [ACTIONS.LOAD_CONTEXT]: 'Generating intelligent context...',
                [ACTIONS.LOAD_CONTEXT_BY_ID]: 'Loading context...',
                [ACTIONS.INJECT_CONTEXT]: 'Injecting context...'
            };

            sendResponse({ ok: true, message: loadingMessages[request.action] || 'Processing...' });

            (async () => {
                try {
                    switch (request.action) {
                        case ACTIONS.STORE_CONTEXT:
                            await handleStoreContext(BACKEND_URL);
                            break;

                        case ACTIONS.LOAD_CONTEXT:
                            await handleLoadContext(BACKEND_URL, true, true);
                            break;

                        case ACTIONS.LOAD_CONTEXT_BY_ID:
                            const userId = request.user_id || await getOrCreateUserId();
                            await handleLoadContextById(request.context_id, userId, BACKEND_URL, false);
                            break;

                        case ACTIONS.INJECT_CONTEXT:
                            await handleInjectContext(BACKEND_URL);
                            break;
                    }
                } catch (error) {
                    console.error(`❌ ${request.action} operation failed:`, error);
                }
            })();

            return true;
        }
    } catch (error) {
        console.error('❌ Error handling runtime message:', error);
        sendResponse({ success: false, error: error.message });
        return true;
    }
});