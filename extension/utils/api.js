// API utilities for backend communication

async function storeToBackend(payload, backendUrl) {
    try {
        const res = await fetch(`${backendUrl}/store`, {
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

async function getAllContexts(userId, backendUrl) {
    try {
        const response = await fetch(`${backendUrl}/get_all?user_id=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            items: data.items || []
        };
    } catch (error) {
        console.error('❌ Error getting all contexts:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function generateContext(userId, maxLength = 2000, backendUrl) {
    try {
        const response = await fetch(`${backendUrl}/generate_context`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                max_length: maxLength
            }),
            credentials: 'omit',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            context: data.context,
            summary: data.summary,
            conversation_count: data.conversation_count,
            context_length: data.context_length
        };
    } catch (error) {
        console.error('❌ Error generating context:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function generateContextById(contextId, userId, maxLength = 2000, backendUrl) {
    try {
        const response = await fetch(`${backendUrl}/generate_context/${contextId}?user_id=${encodeURIComponent(userId)}&max_length=${maxLength}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'omit',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: true,
            context: data.context,
            summary: data.summary,
            context_id: data.context_id,
            title: data.title,
            context_length: data.context_length
        };
    } catch (error) {
        console.error('❌ Error generating context by ID:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Clear all data for a user
 * @param {string} userId - User ID
 * @param {string} backendUrl - Backend API URL
 * @returns {Promise<{ok: boolean, deleted_count?: number, error?: string}>}
 */
async function clearData(userId, backendUrl) {
    try {
        const response = await fetch(`${backendUrl}/clear/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'omit',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        return {
            ok: false,
            error: error.message
        };
    }
}

/**
 * Delete a specific context by context_id
 * @param {string} contextId - Context ID to delete
 * @param {string} userId - User ID to verify ownership
 * @param {string} backendUrl - Backend API URL
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>}
 */
async function deleteContext(contextId, userId, backendUrl) {
    try {
        const response = await fetch(`${backendUrl}/delete_context/${contextId}?user_id=${encodeURIComponent(userId)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'omit',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('❌ Error deleting context:', error);
        return {
            ok: false,
            error: error.message
        };
    }
}