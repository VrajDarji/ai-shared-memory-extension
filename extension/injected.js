(
    function () {
        function emit(payload) {
            try {
                window.postMessage({ from: 'sabki_soch', payload }, '*');
                window.__SABKI_SOCH_LAST_API_PAYLOAD__ = payload?.data || payload?.text || null;
            } catch (e) {
                console.error('⚠️ Extension context unavailable, skipping message');
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
                window.__AI_CONTEXT__ = JSON.parse(storedContext);
                window.__CONTEXT_SUMMARY__ = JSON.parse(storedSummary);
                window.__AI_CONTEXT_INJECTED__ = true;

            }
        } catch (e) {
            console.error('⚠️ Could not auto-restore context from localStorage:', e);
        }

        // Listen for context injection messages from content script
        window.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'SABKI_SOCH_TEST_CONTEXT') {
                if (window.__AI_CONTEXT__ && window.__AI_CONTEXT__.length > 0) {
                } else {
                }
                return;
            }

            if (event.data && event.data.type === 'SABKI_SOCH_CONTEXT_INJECTION') {

                // Store context in main page context for AI access
                window.__AI_CONTEXT__ = event.data.context;
                window.__CONTEXT_SUMMARY__ = event.data.summary;
                window.__AI_CONTEXT_INJECTED__ = event.data.injected;

            }
        });
    }
)()