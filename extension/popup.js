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

document.getElementById('loadBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Show loading state
    const loadBtn = document.getElementById('loadBtn');
    const status = document.getElementById('status');

    setButtonLoading(loadBtn, true, 'Generating...');

    ('📤 Sending load message to tab:', tab.id);

    // First try to inject content script if it's not loaded
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }).then(() => {
        ('✅ Content script injected for load');
        // Wait a moment for content script to fully load, then send message
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: "load_context" }, (resp) => {
                // Check for runtime errors
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError.message);
                    setButtonError(loadBtn, '❌ Failed');
                    status.textContent = 'Content script not responding. Try refreshing the page.';
                    status.className = 'status error';
                    status.style.display = 'block';
                    return;
                }

                ("📥 Load response received:", resp);

                // Show feedback based on response
                if (resp && resp.ok) {
                    setButtonSuccess(loadBtn, '✅ Generated!');
                    status.textContent = `Intelligent context generated and sent!`;
                    status.className = 'status success';
                    status.style.display = 'block';

                    // Close popup after success
                    closePopup(2000);
                } else {
                    setButtonError(loadBtn, '❌ Failed');
                    status.textContent = 'Failed to generate context. Check console for details.';
                    status.className = 'status error';
                    status.style.display = 'block';
                }

                // Hide status after delay
                setTimeout(() => {
                    status.style.display = 'none';
                }, 3000);
            });
        }, 500); // Wait 500ms for content script to initialize
    }).catch((error) => {
        console.error('❌ Failed to inject content script for load:', error);
        setButtonError(loadBtn, '❌ Failed');
        status.textContent = 'Cannot inject content script on this page.';
        status.className = 'status error';
        status.style.display = 'block';

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    });
})

document.getElementById('injectBtn').addEventListener('click', async () => {
    ('🔘 Inject button clicked');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    ('📑 Active tab:', tab);

    if (!tab) {
        console.error('❌ No active tab found');
        return;
    }

    // Show loading state
    const injectBtn = document.getElementById('injectBtn');
    const status = document.getElementById('status');

    setButtonLoading(injectBtn, true, 'Injecting...');

    ('📤 Sending inject message to tab:', tab.id);

    // First try to inject content script if it's not loaded
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }).then(() => {
        ('✅ Content script injected for context injection');
        // Wait a moment for content script to fully load, then send message
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: "inject_context" }, (resp) => {
                // Check for runtime errors
                if (chrome.runtime.lastError) {
                    console.error('❌ Runtime error:', chrome.runtime.lastError.message);
                    setButtonError(injectBtn, '❌ Failed');
                    status.textContent = 'Content script not responding. Try refreshing the page.';
                    status.className = 'status error';
                    status.style.display = 'block';
                    return;
                }

                ("📥 Inject response received:", resp);

                // Show feedback based on response
                if (resp && resp.ok) {
                    setButtonSuccess(injectBtn, '✅ Injected!');
                    status.textContent = 'Context injected into AI system. AI can now reference your stored conversations.';
                    status.className = 'status success';
                    status.style.display = 'block';

                    // Close popup after success
                    closePopup(2000);
                } else {
                    setButtonError(injectBtn, '❌ Failed');
                    if (resp && resp.error) {
                        status.textContent = `Failed: ${resp.error}`;
                    } else {
                        status.textContent = 'Failed to inject context. Make sure backend is running.';
                    }
                    status.className = 'status error';
                    status.style.display = 'block';
                }

                // Reset button after 3 seconds
                setTimeout(() => {
                    injectBtn.querySelector('span').textContent = originalText;
                    injectBtn.disabled = false;
                    status.style.display = 'none';
                }, 3000);
            });
        }, 500); // Wait 500ms for content script to initialize
    }).catch((error) => {
        console.error('❌ Failed to inject content script for context injection:', error);
        injectBtn.querySelector('span').textContent = '❌ Failed';
        status.textContent = 'Cannot inject content script on this page.';
        status.className = 'status error';
        status.style.display = 'block';

        setTimeout(() => {
            injectBtn.querySelector('span').textContent = originalText;
            injectBtn.disabled = false;
            status.style.display = 'none';
        }, 3000);
    });
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