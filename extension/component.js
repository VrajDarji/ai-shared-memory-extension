// Component.js - Main UI component for SabkiSoch extension ( Not refactoring not major core logic just UI )

(function () {
    'use strict';
    // Can't use constants.js here because it is not available in page context
    const MESSAGE_TYPES = {
        GET_USER_ID: 'SABKI_SOCH_GET_USER_ID',
        GET_CONTEXTS: 'SABKI_SOCH_GET_CONTEXTS',
        ACTION: 'SABKI_SOCH_ACTION',
        USER_ID_RESPONSE: 'SABKI_SOCH_USER_ID_RESPONSE',
        CONTEXTS_RESPONSE: 'SABKI_SOCH_CONTEXTS_RESPONSE',
        RESPONSE: 'SABKI_SOCH_RESPONSE',
        FROM_SABKI_SOCH: 'sabki_soch'
    };

    const ACTIONS = {
        STORE_CONTEXT: 'store_context',
        LOAD_CONTEXT: 'load_context',
        LOAD_CONTEXT_BY_ID: 'load_context_by_id',
        CLEAR_DATA: 'clear_data',
        INJECT_CONTEXT: 'inject_context',
        DELETE_CONTEXT: 'delete_context'
    };

    if (window.__SABKI_SOCH_UI_LOADED__) {
        return;
    }

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

    // Check if current domain is whitelisted
    const hostname = window.location.hostname;
    const isWhitelisted = ALLOWED_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isWhitelisted) {
        return;
    }

    window.__SABKI_SOCH_UI_LOADED__ = true;

    const createFloatingButton = () => {
        const button = document.createElement('div');
        button.id = 'sabkisoch-float-btn';
        button.title = 'SabkiSoch - AI Memory (Ctrl+Shift+S)';

        const textNode = document.createTextNode('🧠');
        button.appendChild(textNode);

        Object.assign(button.style, {
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1.5px solid #e5e5e5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            zIndex: '999999',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            userSelect: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1) translateY(-2px)';
            button.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.16)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1) translateY(0)';
            button.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleModal();
        });

        document.body.appendChild(button);
        return button;
    };

    const createModal = () => {
        const overlay = document.createElement('div');
        overlay.id = 'sabkisoch-modal-overlay';

        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000000',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        const modal = document.createElement('div');
        modal.id = 'sabkisoch-modal';

        Object.assign(modal.style, {
            width: '380px',
            maxHeight: '90vh',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transform: 'scale(0.9)',
            transition: 'transform 0.3s ease',
            overflow: 'auto'
        });

        const modalContent = document.createElement('div');
        Object.assign(modalContent.style, {
            padding: '28px 24px 24px 24px',
            color: '#1a1a1a'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            textAlign: 'center',
            marginBottom: '32px',
            paddingBottom: '20px',
            borderBottom: '1px solid #f0f0f0'
        });

        const title = document.createElement('h1');
        title.textContent = '🧠 SabkiSoch';
        Object.assign(title.style, {
            fontSize: '22px',
            fontWeight: '600',
            margin: '0 0 6px 0',
            color: '#1a1a1a'
        });

        const subtitle = document.createElement('p');
        subtitle.textContent = 'AI Memory Extension';
        Object.assign(subtitle.style, {
            fontSize: '13px',
            color: '#666',
            fontWeight: '400',
            margin: '0'
        });

        header.appendChild(title);
        header.appendChild(subtitle);

        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '24px'
        });

        const buttons = [
            { id: 'sabkisoch-store-btn', text: 'Store Current Chat', isDanger: false },
            { id: 'sabkisoch-inject-btn', text: 'Load Context to Chat', isDanger: false },
            { id: 'sabkisoch-clear-btn', text: 'Clear My Data', isDanger: true }
        ];

        buttons.forEach(btnData => {
            const button = document.createElement('button');
            button.id = btnData.id;
            button.textContent = btnData.text;
            button.dataset.originalText = btnData.text;

            Object.assign(button.style, {
                width: '100%',
                padding: '15px 20px',
                border: btnData.isDanger ? '1.5px solid #fecaca' : '1.5px solid #e5e5e5',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                color: btnData.isDanger ? '#991b1b' : '#1a1a1a',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit'
            });

            buttonContainer.appendChild(button);
        });

        const helpText = document.createElement('div');
        Object.assign(helpText.style, {
            background: 'rgba(250, 250, 250, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '18px',
            margin: '20px 0',
            fontSize: '12px',
            lineHeight: '1.6',
            border: '1.5px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        });

        const helpTitle = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = 'How to use:';
        helpTitle.appendChild(strong);
        Object.assign(helpTitle.style, {
            margin: '0 0 10px 0',
            color: '#1a1a1a',
            fontWeight: '600'
        });

        const helpList = document.createElement('ol');
        Object.assign(helpList.style, {
            margin: '0',
            paddingLeft: '20px',
            color: '#666'
        });

        const helpItems = [
            { strong: 'Store', text: ' conversations to save them' },
            { strong: 'Load Context to Chat', text: ' to select and load a specific context into chat' }
        ];

        helpItems.forEach(itemData => {
            const li = document.createElement('li');
            const strong = document.createElement('strong');
            strong.textContent = itemData.strong;
            Object.assign(strong.style, {
                color: '#1a1a1a',
                fontWeight: '500'
            });
            li.appendChild(strong);
            li.appendChild(document.createTextNode(itemData.text));
            Object.assign(li.style, {
                margin: '6px 0'
            });
            helpList.appendChild(li);
        });

        helpText.appendChild(helpTitle);
        helpText.appendChild(helpList);

        const limitInfo = document.createElement('div');
        limitInfo.className = 'limit-info';
        Object.assign(limitInfo.style, {
            background: 'rgba(240, 248, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #dbeafe',
            borderRadius: '12px',
            padding: '16px',
            margin: '16px 0',
            fontSize: '12px',
            color: '#1e40af'
        });

        const limitInfoP1 = document.createElement('p');
        limitInfoP1.textContent = 'Payload size limit: 36KB (36,000 bytes)';
        Object.assign(limitInfoP1.style, {
            margin: '0 0 6px 0',
            fontWeight: '500'
        });

        const limitInfoP2 = document.createElement('p');
        limitInfoP2.textContent = 'Text field limit: 30,000 characters';
        Object.assign(limitInfoP2.style, {
            margin: '0 0 6px 0',
            fontWeight: '500'
        });

        const limitInfoP3 = document.createElement('p');
        limitInfoP3.textContent = 'Payload size estimation: 200 bytes + user_id + source + text + url';
        Object.assign(limitInfoP3.style, {
            margin: '0',
            fontSize: '11px',
            color: '#64748b',
            fontStyle: 'italic'
        });

        limitInfo.appendChild(limitInfoP1);
        limitInfo.appendChild(limitInfoP2);
        limitInfo.appendChild(limitInfoP3);

        const statusDiv = document.createElement('div');
        statusDiv.id = 'sabkisoch-status';
        Object.assign(statusDiv.style, {
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            textAlign: 'center',
            display: 'none',
            border: '1.5px solid',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        });

        const footer = document.createElement('div');
        Object.assign(footer.style, {
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
            fontSize: '11px',
            color: '#999'
        });

        const footerText = document.createElement('span');
        footerText.textContent = 'v1.0.0 MVP - Vibe Coded by';

        const footerLink = document.createElement('a');
        footerLink.href = 'https://github.com/VrajDarji';
        footerLink.target = '_blank';
        footerLink.textContent = ' Vraj';
        Object.assign(footerLink.style, {
            color: '#666',
            textDecoration: 'none'
        });

        footer.appendChild(footerText);
        footer.appendChild(footerLink);

        modalContent.appendChild(header);
        modalContent.appendChild(buttonContainer);
        modalContent.appendChild(helpText);
        modalContent.appendChild(limitInfo);
        modalContent.appendChild(statusDiv);
        modalContent.appendChild(footer);

        modal.appendChild(modalContent);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                toggleModal();
            }
        });

        const modalButtons = modal.querySelectorAll('button');
        modalButtons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(249, 249, 249, 0.95)';
                btn.style.borderColor = btn.id === 'sabkisoch-clear-btn' ? '#fca5a5' : '#d0d0d0';
                btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                btn.style.transform = 'translateY(-1px)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.8)';
                btn.style.borderColor = btn.id === 'sabkisoch-clear-btn' ? '#fecaca' : '#e5e5e5';
                btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                btn.style.transform = 'translateY(0)';
            });
        });

        connectButtonActions();

        return overlay;
    };

    const toggleModal = () => {
        const overlay = document.getElementById('sabkisoch-modal-overlay');
        const modal = document.getElementById('sabkisoch-modal');

        if (!overlay || !modal) {
            console.error('❌ Modal elements not found');
            return;
        }

        if (overlay.style.display === 'none') {
            overlay.style.display = 'flex';
            setTimeout(() => {
                overlay.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
        } else {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    };

    const connectButtonActions = () => {
        document.getElementById('sabkisoch-store-btn').addEventListener('click', () => {
            setButtonLoading('sabkisoch-store-btn', 'Storing...');
            window.postMessage({
                type: MESSAGE_TYPES.ACTION,
                action: ACTIONS.STORE_CONTEXT
            }, '*');
        });

        document.getElementById('sabkisoch-inject-btn').addEventListener('click', () => {
            openContextSelectionModal();
        });

        document.getElementById('sabkisoch-clear-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all stored data?')) {
                setButtonLoading('sabkisoch-clear-btn', 'Clearing...');
                window.postMessage({
                    type: MESSAGE_TYPES.ACTION,
                    action: ACTIONS.CLEAR_DATA
                }, '*');
            }
        });
    };

    const setButtonLoading = (buttonId, loadingText) => {
        const button = document.getElementById(buttonId);
        if (!button) return;

        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
    };

    const setButtonSuccess = (buttonId, successText) => {
        const button = document.getElementById(buttonId);
        if (!button) return;

        button.textContent = successText;
        button.style.background = '#f0fdf4';
        button.style.borderColor = '#bbf7d0';
        button.style.color = '#166534';

        setTimeout(() => {
            button.textContent = button.dataset.originalText || 'Button';
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.background = 'rgba(255, 255, 255, 0.8)';
            button.style.borderColor = button.id === 'sabkisoch-clear-btn' ? '#fecaca' : '#e5e5e5';
            button.style.color = button.id === 'sabkisoch-clear-btn' ? '#991b1b' : '#1a1a1a';
        }, 2000);
    };

    const setButtonError = (buttonId, errorText) => {
        const button = document.getElementById(buttonId);
        if (!button) return;

        button.textContent = errorText;
        button.style.background = '#fef2f2';
        button.style.borderColor = '#fecaca';
        button.style.color = '#991b1b';

        setTimeout(() => {
            button.textContent = button.dataset.originalText || 'Button';
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.background = 'rgba(255, 255, 255, 0.8)';
            button.style.borderColor = button.id === 'sabkisoch-clear-btn' ? '#fecaca' : '#e5e5e5';
            button.style.color = button.id === 'sabkisoch-clear-btn' ? '#991b1b' : '#1a1a1a';
        }, 3000);
    };

    window.addEventListener('message', (event) => {
        if (!event.data || event.data.type !== MESSAGE_TYPES.RESPONSE) return;

        const { action, success, message } = event.data;

        if (action === ACTIONS.STORE_CONTEXT) {
            if (success) {
                setButtonSuccess('sabkisoch-store-btn', '✅ Stored!');
            } else {
                setButtonError('sabkisoch-store-btn', '❌ Failed');
            }
        } else if (action === ACTIONS.INJECT_CONTEXT) {
            if (success) {
                setButtonSuccess('sabkisoch-inject-btn', '✅ Loaded!');
            } else {
                setButtonError('sabkisoch-inject-btn', '❌ Failed');
            }
        } else if (action === ACTIONS.LOAD_CONTEXT_BY_ID) {
            if (success) {
                setButtonSuccess('sabkisoch-inject-btn', '✅ Loaded & Sent!');
                closeContextSelectionModal();
                toggleModal();
            } else {
                setButtonError('sabkisoch-inject-btn', '❌ Failed');
                const contextList = document.getElementById('sabkisoch-context-list-container');
                if (contextList) {
                    const errorDiv = document.createElement('div');
                    errorDiv.textContent = 'Failed to load context. Please try again.';
                    Object.assign(errorDiv.style, {
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#1a1a1a',
                        fontSize: '14px',
                        fontWeight: '500'
                    });
                    contextList.innerHTML = '';
                    contextList.appendChild(errorDiv);
                }
            }
        } else if (action === ACTIONS.CLEAR_DATA) {
            if (success) {
                setButtonSuccess('sabkisoch-clear-btn', '✅ Cleared!');
                setTimeout(() => {
                    toggleModal();
                }, 1500);
            } else {
                setButtonError('sabkisoch-clear-btn', '❌ Failed');
            }
        } else if (action === ACTIONS.DELETE_CONTEXT) {
            if (success) {

                const overlay = document.getElementById('sabkisoch-context-modal-overlay');
                if (overlay && overlay.style.display !== 'none') {
                    openContextSelectionModal();
                }
            }
            showStatus(success ? 'success' : 'error', message);
            return; // Don't show status again below for delete action
        }

        showStatus(success ? 'success' : 'error', message);
    });

    const showStatus = (type, message) => {
        const status = document.getElementById('sabkisoch-status');
        if (!status) return;

        status.textContent = message;
        status.style.display = 'block';

        if (type === 'success') {
            status.style.background = '#f0fdf4';
            status.style.borderColor = '#bbf7d0';
            status.style.color = '#166534';
        } else {
            status.style.background = '#fef2f2';
            status.style.borderColor = '#fecaca';
            status.style.color = '#991b1b';
        }

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    };

    const createContextSelectionModal = () => {
        const overlay = document.createElement('div');
        overlay.id = 'sabkisoch-context-modal-overlay';

        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000001',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        const modal = document.createElement('div');
        modal.id = 'sabkisoch-context-modal';

        Object.assign(modal.style, {
            width: '420px',
            maxHeight: '80vh',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            transform: 'scale(0.9)',
            transition: 'transform 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });

        const title = document.createElement('h2');
        title.textContent = 'Select Context to Load';
        Object.assign(title.style, {
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0'
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.id = 'sabkisoch-context-modal-close';
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            padding: '0',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
        });

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#f0f0f0';
            closeBtn.style.color = '#1a1a1a';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
            closeBtn.style.color = '#666';
        });

        closeBtn.addEventListener('click', closeContextSelectionModal);

        header.appendChild(title);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.id = 'sabkisoch-context-list-container';
        Object.assign(body.style, {
            padding: '16px',
            overflowY: 'auto',
            flex: '1'
        });

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeContextSelectionModal();
            }
        });

        return overlay;
    };

    const openContextSelectionModal = async () => {
        let overlay = document.getElementById('sabkisoch-context-modal-overlay');
        if (!overlay) {
            overlay = createContextSelectionModal();
        }

        const container = document.getElementById('sabkisoch-context-list-container');
        container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #1a1a1a; font-size: 14px; font-weight: 500;">Loading contexts...</div>';

        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.opacity = '1';
            const modal = document.getElementById('sabkisoch-context-modal');
            if (modal) modal.style.transform = 'scale(1)';
        }, 10);

        try {
            const contexts = await new Promise((resolve) => {
                window.postMessage({
                    type: MESSAGE_TYPES.GET_CONTEXTS
                }, '*');

                const handleResponse = (event) => {
                    if (event.data && event.data.type === MESSAGE_TYPES.CONTEXTS_RESPONSE) {
                        window.removeEventListener('message', handleResponse);
                        resolve(event.data);
                    }
                };

                window.addEventListener('message', handleResponse);

                setTimeout(() => {
                    window.removeEventListener('message', handleResponse);
                    resolve({ success: false, error: 'Timeout' });
                }, 5000);
            });

            if (!contexts.success) {
                container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #1a1a1a; font-size: 14px; font-weight: 500;">Failed to load contexts. Please try again.</div>';
                return;
            }

            if (!contexts.contexts || contexts.contexts.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #1a1a1a; font-size: 14px; font-weight: 500;">No stored contexts found. Store a conversation first!</div>';
                return;
            }

            displayContextsList(contexts.contexts);
        } catch (error) {
            console.error('Error loading contexts:', error);
            container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #1a1a1a; font-size: 14px; font-weight: 500;">Failed to load contexts. Please try again.</div>';
        }
    };

    const displayContextsList = (contexts) => {
        const container = document.getElementById('sabkisoch-context-list-container');

        contexts.sort((a, b) => {
            const timeA = new Date(a.metadata?.time || 0);
            const timeB = new Date(b.metadata?.time || 0);
            return timeB - timeA;
        });

        const list = document.createElement('div');
        Object.assign(list.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });

        contexts.forEach((context) => {
            const item = document.createElement('div');
            Object.assign(item.style, {
                padding: '14px 16px',
                border: '1.5px solid #e5e5e5',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
            });

            item.addEventListener('mouseenter', () => {
                item.style.borderColor = '#d0d0d0';
                item.style.background = 'rgba(249, 249, 249, 0.95)';
                item.style.transform = 'translateY(-1px)';
                item.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            });

            item.addEventListener('mouseleave', () => {
                item.style.borderColor = '#e5e5e5';
                item.style.background = 'rgba(255, 255, 255, 0.8)';
                item.style.transform = 'translateY(0)';
                item.style.boxShadow = 'none';
            });

            const contentWrapper = document.createElement('div');
            Object.assign(contentWrapper.style, {
                flex: '1',
                minWidth: '0'
            });

            const title = document.createElement('div');
            title.textContent = context.metadata?.title || 'Untitled Conversation';
            Object.assign(title.style, {
                fontSize: '14px',
                fontWeight: '500',
                color: '#1a1a1a',
                marginBottom: '6px'
            });

            const time = document.createElement('div');
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
            Object.assign(time.style, {
                fontSize: '12px',
                color: '#666'
            });

            contentWrapper.appendChild(title);
            contentWrapper.appendChild(time);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete this context';
            Object.assign(deleteBtn.style, {
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                flexShrink: '0',
                opacity: '0.6'
            });

            deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.opacity = '1';
                deleteBtn.style.background = 'rgba(254, 202, 202, 0.3)';
            });

            deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.opacity = '0.6';
                deleteBtn.style.background = 'none';
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteContextById(context.id, context.metadata?.title || 'Untitled Conversation');
            });

            item.appendChild(contentWrapper);
            item.appendChild(deleteBtn);

            item.addEventListener('click', (e) => {
                // Don't trigger load if clicking on delete button
                if (e.target === deleteBtn || deleteBtn.contains(e.target)) {
                    return;
                }
                loadContextById(context.id);
            });

            list.appendChild(item);
        });

        container.innerHTML = '';
        container.appendChild(list);
    };

    const loadContextById = async (contextId) => {
        try {
            const contextList = document.getElementById('sabkisoch-context-list-container');
            if (contextList) {
                const loadingDiv = document.createElement('div');
                loadingDiv.textContent = 'Loading context...';
                Object.assign(loadingDiv.style, {
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#1a1a1a',
                    fontSize: '14px',
                    fontWeight: '500'
                });
                contextList.innerHTML = '';
                contextList.appendChild(loadingDiv);
            }

            window.postMessage({
                type: MESSAGE_TYPES.ACTION,
                action: ACTIONS.LOAD_CONTEXT_BY_ID,
                context_id: contextId
            }, '*');

        } catch (error) {
            console.error('Error loading context:', error);
            const contextList = document.getElementById('sabkisoch-context-list-container');
            if (contextList) {
                const errorDiv = document.createElement('div');
                errorDiv.textContent = 'Error loading context. Please try again.';
                Object.assign(errorDiv.style, {
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#1a1a1a',
                    fontSize: '14px',
                    fontWeight: '500'
                });
                contextList.innerHTML = '';
                contextList.appendChild(errorDiv);
            }
        }
    };

    const deleteContextById = async (contextId, contextTitle) => {
        if (!confirm(`Are you sure you want to delete "${contextTitle}"?`)) {
            return;
        }

        try {
            window.postMessage({
                type: MESSAGE_TYPES.ACTION,
                action: ACTIONS.DELETE_CONTEXT,
                context_id: contextId
            }, '*');
        } catch (error) {
            console.error('Error deleting context:', error);
            showStatus('error', 'Failed to delete context. Please try again.');
        }
    };

    const closeContextSelectionModal = () => {
        const overlay = document.getElementById('sabkisoch-context-modal-overlay');
        if (!overlay) return;

        overlay.style.opacity = '0';
        const modal = document.getElementById('sabkisoch-context-modal');
        if (modal) modal.style.transform = 'scale(0.9)';

        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    };

    const initUI = () => {
        try {
            createFloatingButton();
            createModal();
        } catch (error) {
            console.error('❌ Failed to initialize UI:', error);
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            toggleModal();
        }
    });


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }

    window.__SABKI_SOCH_TOGGLE_MODAL__ = toggleModal;

})();