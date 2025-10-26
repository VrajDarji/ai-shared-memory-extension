(
    function () {
        function emit(payload) {
            try {
                window.postMessage({ from: 'sabki_soch', payload }, '*');
                // global variable to store the last payload
                window.__SABKI_SOCH_LAST_API_PAYLOAD__ = payload?.data || payload?.text || null;
            } catch (e) {
                // Silently ignore extension context errors
                ('⚠️ Extension context unavailable, skipping message');
            }
        }

        const originFetch = window.fetch;
        window.fetch = async function (...args) {
            const res = await originFetch.apply(this, args);
            try {
                const url = args[0] && args[0].toString();
                // TODO : To check and match actual endpoiints if there are any which sends data on request!!!!
                if (/conversation|backend-api|share|messages|api/.test(url)) {
                    const clone = res.clone();
                    clone.json().then(json => {
                        emit({ url, data: json });
                    }).catch(() => {
                        clone.text().then(text => emit({ url, text }));
                    });
                }
            } catch (e) {
                // Ignore errors
            }
            return res;
        };

        // monkeypatch XHR for older calls
        try {
            const originXHR = window.XMLHttpRequest;
            function newXHR() {
                const xhr = new originXHR();
                xhr.addEventListener('load', () => {
                    try {
                        const url = this.responseURL || this.responseText;
                        if (/conversation|backend-api|share|messages|api/.test(url)) {
                            let body = this.responseText;
                            try { body = JSON.parse(body); } catch (e) { }
                            emit({ url, body });
                        }
                    } catch (e) { }
                })
                return xhr;
            }
            window.XMLHttpRequest = newXHR;
        } catch (e) { }

        // Auto-restore context from localStorage on page load
        try {
            const storedContext = localStorage.getItem('__SABKI_SOCH_AI_CONTEXT__');
            const storedSummary = localStorage.getItem('__SABKI_SOCH_CONTEXT_SUMMARY__');
            const wasInjected = localStorage.getItem('__SABKI_SOCH_CONTEXT_INJECTED__') === 'true';

            if (storedContext && storedSummary && wasInjected) {
                ('🔄 Auto-restoring context from localStorage on page load');
                window.__AI_CONTEXT__ = JSON.parse(storedContext);
                window.__CONTEXT_SUMMARY__ = JSON.parse(storedSummary);
                window.__AI_CONTEXT_INJECTED__ = true;

                ('🧠 AI Context auto-restored from localStorage:', {
                    totalConversations: window.__AI_CONTEXT__?.length || 0,
                    sources: window.__CONTEXT_SUMMARY__?.sources || [],
                    contextAvailable: window.__CONTEXT_SUMMARY__?.contextAvailable || false
                });
            }
        } catch (e) {
            ('⚠️ Could not auto-restore context from localStorage:', e);
        }

        // Listen for context injection messages from content script
        window.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'SABKI_SOCH_TEST_CONTEXT') {
                ('🔍 AI Context Access Test:');
                ('  - window.__AI_CONTEXT__ exists:', !!window.__AI_CONTEXT__);
                ('  - window.__AI_CONTEXT__ length:', window.__AI_CONTEXT__?.length || 0);
                ('  - window.__CONTEXT_SUMMARY__ exists:', !!window.__CONTEXT_SUMMARY__);

                if (window.__AI_CONTEXT__ && window.__AI_CONTEXT__.length > 0) {
                    ('✅ AI can access context!');
                    ('📝 Sample conversation:', window.__AI_CONTEXT__[0]);
                    ('📊 Context summary:', window.__CONTEXT_SUMMARY__);
                } else {
                    ('❌ AI cannot access context');
                }
                return;
            }

            if (event.data && event.data.type === 'SABKI_SOCH_CONTEXT_INJECTION') {
                ('🧠 Received context injection from content script');

                // Store context in main page context for AI access
                window.__AI_CONTEXT__ = event.data.context;
                window.__CONTEXT_SUMMARY__ = event.data.summary;
                window.__AI_CONTEXT_INJECTED__ = event.data.injected;

                // Also inject test functions for debugging
                window.testAIContextAccess = function () {
                    ('🧪 Testing AI context access from main page context...');
                    ('🔍 AI Context Access Test:');
                    ('  - window.__AI_CONTEXT__ exists:', !!window.__AI_CONTEXT__);
                    ('  - window.__AI_CONTEXT__ length:', window.__AI_CONTEXT__?.length || 0);
                    ('  - window.__CONTEXT_SUMMARY__ exists:', !!window.__CONTEXT_SUMMARY__);

                    if (window.__AI_CONTEXT__ && window.__AI_CONTEXT__.length > 0) {
                        ('✅ AI can access context!');
                        ('📝 Sample conversation:', window.__AI_CONTEXT__[0]);
                        ('📊 Context summary:', window.__CONTEXT_SUMMARY__);
                    } else {
                        ('❌ AI cannot access context');
                    }
                };

                window.testSabkiSoch = function () {
                    ('🧪 Testing SabkiSoch Extension...');
                    ('📊 Extension Status:', {
                        contextAvailable: !!window.__AI_CONTEXT__,
                        contextCount: window.__AI_CONTEXT__?.length || 0,
                        contextSummary: window.__CONTEXT_SUMMARY__ || null,
                        localStorage: !!localStorage.getItem('__SABKI_SOCH_AI_CONTEXT__'),
                        localStorageInjected: localStorage.getItem('__SABKI_SOCH_CONTEXT_INJECTED__'),
                        localStorageTimestamp: localStorage.getItem('__SABKI_SOCH_CONTEXT_TIMESTAMP__')
                    });

                    if (window.__AI_CONTEXT__) {
                        ('📝 Sample conversations:');
                        window.__AI_CONTEXT__.slice(0, 3).forEach((conv, i) => {
                            (`${i + 1}. [${conv.source}] ${conv.text.substring(0, 100)}...`);
                        });
                    }

                    return {
                        contextAvailable: !!window.__AI_CONTEXT__,
                        contextCount: window.__AI_CONTEXT__?.length || 0
                    };
                };

                ('🧠 AI Context injected into main page context:', {
                    totalConversations: window.__AI_CONTEXT__?.length || 0,
                    sources: window.__CONTEXT_SUMMARY__?.sources || [],
                    contextAvailable: window.__CONTEXT_SUMMARY__?.contextAvailable || false
                });
            }
        });
    }
)()