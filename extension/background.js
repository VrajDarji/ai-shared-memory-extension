chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === 'page_api_data') {
        // optionally forward to backend directly from background
        // fetch('http://localhost:8000/store', { ... })

        try {
            const res = await fetch('http://localhost:8000/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(msg.payload),
            })
        }
        catch (err) {
            console.error('Error storing page API data:', err);
        }
        sendResponse({ ok: true, message: 'Page API data stored' });
        return true;
    }
});
