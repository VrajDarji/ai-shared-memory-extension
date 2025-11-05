// Action handler functions for content.js
// Note: ACTIONS constants are defined in constants.js and available globally

/**
 * Helper to load context and inject into AI
 */
async function loadAndInjectContext(contextData, autoSend = true) {
    window.__SABKI_SOCH_CONTEXT__ = [{
        text: contextData.context,
        metadata: {
            source: 'generated',
            summary: contextData.summary,
            conversation_count: contextData.conversation_count,
            context_length: contextData.context_length,
            context_id: contextData.context_id,
            title: contextData.title
        }
    }];

    injectContextIntoAI();

    if (autoSend) {
        setTimeout(() => {
            const sendButton = findSendButton();
            if (sendButton) {
                sendButton.click();
            }
        }, 1000);
    }
}

/**
 * Handle store context action
 */
async function handleStoreContext(backendUrl) {
    let content = window.__SABKI_SOCH_LAST_API_PAYLOAD__ || scrapeVisibleChat();
    if (!content) {
        return { success: false, message: 'No content to store' };
    }

    const payload = {
        user_id: await getOrCreateUserId(),
        source: location.hostname,
        text: content,
        url: location.href,
    };

    const result = await storeToBackend(payload, backendUrl);
    return {
        success: result.ok,
        message: result.ok ? 'Chat stored successfully!' : 'Failed to store chat'
    };
}

/**
 * Handle load context action
 */
async function handleLoadContext(backendUrl, autoSend = true, sendNotification = false) {
    const userId = await getOrCreateUserId();
    const result = await generateContext(userId, 2000, backendUrl);

    if (!result.success || !result.context || result.context.length === 0) {
        const errorMsg = result.error || 'No conversations found to generate context from';
        if (sendNotification) {
            showContextNotification(0, errorMsg);
        }
        return { success: false, message: errorMsg };
    }

    await loadAndInjectContext(result, autoSend);

    const message = `Intelligent context generated and sent from ${result.conversation_count} conversations!`;
    if (sendNotification) {
        showContextNotification(result.conversation_count, message);
    }

    return {
        success: true,
        message,
        conversation_count: result.conversation_count
    };
}

/**
 * Handle load context by ID action
 */
async function handleLoadContextById(contextId, userId, backendUrl, autoSend = true) {
    const result = await generateContextById(contextId, userId, 2000, backendUrl);

    if (result.success && result.context && result.context.length > 0) {
        await loadAndInjectContext(result, autoSend);
        return {
            success: true,
            message: 'Context loaded and sent successfully!'
        };
    }

    return {
        success: false,
        message: result.error || 'No context generated'
    };
}

/**
 * Handle clear data action
 */
async function handleClearData(userId, backendUrl) {
    const result = await clearData(userId, backendUrl);
    return {
        success: result.ok,
        message: result.ok
            ? `Cleared ${result.deleted_count} documents`
            : (result.error || 'Failed to clear data')
    };
}

/**
 * Handle delete context action
 */
async function handleDeleteContext(contextId, userId, backendUrl) {
    const result = await deleteContext(contextId, userId, backendUrl);
    return {
        success: result.ok,
        message: result.ok
            ? (result.message || 'Context deleted successfully')
            : (result.error || 'Failed to delete context')
    };
}

/**
 * Handle inject context action
 */
async function handleInjectContext(backendUrl) {
    if (!window.__SABKI_SOCH_CONTEXT__) {
        const userId = await getOrCreateUserId();
        const result = await generateContext(userId, 2000, backendUrl);

        if (result.success && result.context && result.context.length > 0) {
            window.__SABKI_SOCH_CONTEXT__ = [{
                text: result.context,
                metadata: {
                    source: 'generated',
                    summary: result.summary,
                    conversation_count: result.conversation_count,
                    context_length: result.context_length
                }
            }];
        }
    }

    if (window.__SABKI_SOCH_CONTEXT__) {
        injectContextIntoAI();
        return { success: true };
    }

    return { success: false, message: 'No context available' };
}

