// Script injection utilities

// Whitelist of allowed domains for UI injection
const ALLOWED_DOMAINS = [
    'chat.openai.com',
    'chatgpt.com',
    'claude.ai',
    'gemini.google.com',
    'chat.deepseek.com',
    'www.deepseek.com',
    'deepseek.com',
    'perplexity.ai',
    'poe.com',
    'huggingface.co',
    'huggingface.com'
];

function isWhitelistedDomain() {
    const hostname = window.location.hostname;
    return ALLOWED_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
    );
}

function injectScript(scriptName, fallbackPath = null) {
    return new Promise((resolve, reject) => {
        try {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(scriptName);

            script.onload = () => {
                script.remove();
                resolve();
            };

            script.onerror = (e) => {
                console.error(`⚠️ Failed to inject ${scriptName}:`, e);

                if (fallbackPath) {
                    try {
                        const fallback = document.createElement('script');
                        fallback.src = fallbackPath;

                        fallback.onload = () => {
                            fallback.remove();
                            resolve();
                        };

                        fallback.onerror = (e2) => {
                            console.error(`⚠️ Failed to load ${scriptName} via fallback:`, e2);
                            reject(e2);
                        };

                        (document.head || document.documentElement).appendChild(fallback);
                    } catch (e2) {
                        reject(e2);
                    }
                } else {
                    reject(e);
                }
            };

            (document.head || document.documentElement).appendChild(script);
        } catch (e) {
            console.error(`⚠️ Error injecting ${scriptName}:`, e);
            reject(e);
        }
    });
}

function initializeScripts() {
    // Only inject UI component on whitelisted domains
    if (!window.__SABKI_SOCH_UI_INJECTED__ && isWhitelistedDomain()) {
        window.__SABKI_SOCH_UI_INJECTED__ = true;

        const injectUI = () => {
            injectScript('component.js').catch(e => {
                console.error('❌ Error injecting component.js:', e);
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(injectUI, 500);
            });
        } else {
            setTimeout(injectUI, 500);
        }
    }

    if (!window.__SABKI_SOCH_INJECTED_LOADED__) {
        injectScript('injected.js', './injected.js')
            .then(() => {
                window.__SABKI_SOCH_INJECTED_LOADED__ = true;
            })
            .catch(e => {
                console.error('⚠️ All injection methods failed for injected.js:', e);
            });
    }
}

