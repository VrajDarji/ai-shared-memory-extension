// Storage utilities for managing user data and context persistence

let cachedUserId = null;

function getOrCreateUserId() {
    return new Promise(resolve => {
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
            const id = crypto.randomUUID();
            cachedUserId = id;
            resolve(id);
        }
    });
}

function restoreContextFromStorage() {
    const wasInjected = localStorage.getItem('__SABKI_SOCH_CONTEXT_INJECTED__') === 'true';
    const injectedTimestamp = localStorage.getItem('__SABKI_SOCH_CONTEXT_TIMESTAMP__');

    if (window.__AI_CONTEXT_INJECTED__) {
        return true;
    }

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

