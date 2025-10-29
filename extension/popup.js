// Helper functions for loading states
function setButtonLoading(button, isLoading, loadingText = null) {
    const span = button.querySelector('span');
    const originalText = span.textContent;

    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        span.innerHTML = `<div class="spinner"></div>${loadingText || 'Loading...'}`;
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        span.textContent = originalText;
    }
}

function setButtonSuccess(button, successText, duration = 2000) {
    const span = button.querySelector('span');
    const originalText = span.textContent;

    span.textContent = successText;
    button.classList.add('success');

    setTimeout(() => {
        span.textContent = originalText;
        button.classList.remove('success');
    }, duration);
}

function setButtonError(button, errorText, duration = 3000) {
    const span = button.querySelector('span');
    const originalText = span.textContent;

    span.textContent = errorText;
    button.classList.add('error');

    setTimeout(() => {
        span.textContent = originalText;
        button.classList.remove('error');
    }, duration);
}

function closePopup(delay = 1500) {
    setTimeout(() => {
        window.close();
    }, delay);
}

document.getElementById('storeBtn').addEventListener('click', async () => {
    ('🔘 Store button clicked');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    ('📑 Active tab:', tab);

    if (!tab) {
        console.error('❌ No active tab found');
        return;
    }

    // Show loading state
    const storeBtn = document.getElementById('storeBtn');
    const status = document.getElementById('status');

    setButtonLoading(storeBtn, true, 'Storing...');

    ('📤 Sending message to tab:', tab.id);

    // First try to inject content script if it's not loaded
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }).then(() => {
        ('✅ Content script injected successfully');
        // Wait a moment for content script to fully load, then send message
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: "store_context" }, (resp) => {
                // Check for runtime errors
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError.message);
                    setButtonError(storeBtn, '❌ Failed');
                    status.textContent = 'Content script not responding. Try refreshing the page.';
                    status.className = 'status error';
                    status.style.display = 'block';
                    return;
                }

                ("📥 Response received:", resp);

                // Show feedback based on response
                if (resp && resp.ok) {
                    setButtonSuccess(storeBtn, '✅ Stored!');
                    status.textContent = 'Conversation stored successfully!';
                    status.className = 'status success';
                    status.style.display = 'block';

                    // Close popup after success
                    closePopup(2000);
                } else {
                    setButtonError(storeBtn, '❌ Failed');
                    if (resp && resp.error) {
                        status.textContent = `Failed: ${resp.error}`;
                    } else {
                        status.textContent = 'Failed to store conversation. Make sure backend is running.';
                    }
                    status.className = 'status error';
                    status.style.display = 'block';
                }

                // Reset button after 2 seconds
                setTimeout(() => {
                    storeBtn.querySelector('span').textContent = originalText;
                    storeBtn.disabled = false;
                    status.style.display = 'none';
                }, 2000);
            });
        }, 500); // Wait 500ms for content script to initialize
    }).catch((error) => {
        console.error('❌ Failed to inject content script:', error);
        storeBtn.querySelector('span').textContent = '❌ Failed';
        status.textContent = 'Cannot inject content script on this page.';
        status.className = 'status error';
        status.style.display = 'block';

        setTimeout(() => {
            storeBtn.querySelector('span').textContent = originalText;
            storeBtn.disabled = false;
            status.style.display = 'none';
        }, 3000);
    });
})

// Context selection modal functions
async function openContextSelectionModal() {
    const overlay = document.getElementById('contextModalOverlay');
    const modal = document.getElementById('contextModal');
    const container = document.getElementById('contextListContainer');

    // Show modal
    overlay.classList.add('show');
    modal.classList.add('show');

    // Show loading state
    container.innerHTML = '<div class="context-loading">Loading contexts...</div>';

    try {
        // Get user ID
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Request contexts from content script
        const contexts = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { type: 'SABKI_SOCH_GET_CONTEXTS' }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    resolve(response || { success: false, error: 'No response' });
                }
            });
        });

        if (!contexts.success) {
            container.innerHTML = '<div class="context-empty">Failed to load contexts. Please try again.</div>';
            return;
        }

        if (!contexts.contexts || contexts.contexts.length === 0) {
            container.innerHTML = '<div class="context-empty">No stored contexts found. Store a conversation first!</div>';
            return;
        }

        // Display contexts
        displayContexts(contexts.contexts, tab.id);

    } catch (error) {
        console.error('Error loading contexts:', error);
        container.innerHTML = '<div class="context-empty">Failed to load contexts. Please try again.</div>';
    }
}

function displayContexts(contexts, tabId) {
    const container = document.getElementById('contextListContainer');

    // Sort by time (newest first)
    contexts.sort((a, b) => {
        const timeA = new Date(a.metadata?.time || 0);
        const timeB = new Date(b.metadata?.time || 0);
        return timeB - timeA;
    });

    const list = document.createElement('div');
    list.className = 'context-list';

    contexts.forEach((context) => {
        const item = document.createElement('div');
        item.className = 'context-item';

        const title = document.createElement('div');
        title.className = 'context-item-title';
        title.textContent = context.metadata?.title || 'Untitled Conversation';

        const time = document.createElement('div');
        time.className = 'context-item-time';
        const timeStr = context.metadata?.time || '';
        if (timeStr) {
            try {
                const date = new Date(timeStr);
                time.textContent = date.toLocaleString();
            } catch (e) {
                time.textContent = timeStr;
            }
        } else {
            time.textContent = 'Unknown time';
        }

        item.appendChild(title);
        item.appendChild(time);

        item.addEventListener('click', async () => {
            await loadContextById(context.id, tabId, item);
        });

        list.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(list);
}

async function loadContextById(contextId, tabId, itemElement) {
    itemElement.classList.add('loading');

    try {
        // Get user ID
        const userId = await new Promise((resolve) => {
            chrome.storage.local.get(['ai_mem_user_id'], (res) => {
                resolve(res.ai_mem_user_id || null);
            });
        });

        if (!userId) {
            throw new Error('No user ID found');
        }

        // Inject content script
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });

        // Wait for content script to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send message to content script to load specific context
        chrome.tabs.sendMessage(tabId, {
            action: "load_context_by_id",
            context_id: contextId,
            user_id: userId
        }, (resp) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Runtime error:', chrome.runtime.lastError.message);
                showContextError('Failed to load context. Please refresh the page.');
                itemElement.classList.remove('loading');
                return;
            }

            if (resp && resp.ok) {
                // Close modal and show success
                closeContextSelectionModal();
                const status = document.getElementById('status');
                status.textContent = 'Context loaded successfully!';
                status.className = 'status success';
                status.style.display = 'block';
                closePopup(2000);
            } else {
                showContextError(resp?.error || 'Failed to load context');
                itemElement.classList.remove('loading');
            }
        });

    } catch (error) {
        console.error('Error loading context:', error);
        showContextError('Failed to load context: ' + error.message);
        itemElement.classList.remove('loading');
    }
}

function closeContextSelectionModal() {
    const overlay = document.getElementById('contextModalOverlay');
    const modal = document.getElementById('contextModal');
    overlay.classList.remove('show');
    modal.classList.remove('show');
}

function showContextError(message) {
    const container = document.getElementById('contextListContainer');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'context-empty';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Close modal handlers
document.getElementById('contextModalClose').addEventListener('click', closeContextSelectionModal);
document.getElementById('contextModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'contextModalOverlay') {
        closeContextSelectionModal();
    }
});

document.getElementById('injectBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        console.error('❌ No active tab found');
        return;
    }

    // Open context selection modal
    openContextSelectionModal();
});

// Clear button handler
document.getElementById('clearBtn').addEventListener('click', async () => {
    const clearBtn = document.getElementById('clearBtn');
    const status = document.getElementById('status');
    const originalText = clearBtn.querySelector('span').textContent;

    // Confirm before clearing
    if (!confirm('⚠️ Are you sure you want to clear YOUR stored data?\n\nThis action cannot be undone!')) {
        return;
    }

    setButtonLoading(clearBtn, true, 'Clearing...');

    try {
        ('🗑️ Clearing user data...');

        // First, get the current user ID from the content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Inject content script to get user ID
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
                // Get user ID from storage
                return new Promise((resolve) => {
                    chrome.storage.local.get(['ai_mem_user_id'], (res) => {
                        resolve(res.ai_mem_user_id || null);
                    });
                });
            }
        }).then(async (results) => {
            const userId = results[0]?.result;

            if (!userId) {
                throw new Error('Could not get user ID');
            }

            ('🆔 Clearing data for user:', userId);

            // Call the user-specific clear endpoint
            const response = await fetch(`https://sabkisoch-backend.vercel.app/clear/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.ok) {
                setButtonSuccess(clearBtn, '✅ Cleared!');
                status.textContent = `Successfully cleared ${result.deleted_count} of your documents.`;
                status.className = 'status success';
                status.style.display = 'block';

                // Close popup after success
                closePopup(2000);
            } else {
                throw new Error(result.message || 'Failed to clear data');
            }
        });

    } catch (error) {
        console.error('❌ Error clearing data:', error);
        setButtonError(clearBtn, '❌ Failed');
        status.textContent = `Failed to clear data: ${error.message}`;
        status.className = 'status error';
        status.style.display = 'block';
    }

    // Hide status after delay (only if not closing popup)
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
});