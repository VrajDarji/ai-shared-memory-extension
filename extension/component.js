
(function () {
    'use strict';

    // Prevent multiple injections
    if (window.__SABKI_SOCH_UI_LOADED__) {
        ('⚠️ SabkiSoch UI already loaded, skipping...');
        return;
    }
    window.__SABKI_SOCH_UI_LOADED__ = true;

    ('🎨 Loading SabkiSoch UI components...');

    // Create floating button
    const createFloatingButton = () => {
        const button = document.createElement('div');
        button.id = 'sabkisoch-float-btn';
        button.title = 'SabkiSoch - AI Memory (Ctrl+Shift+S)';

        // Create text node instead of using innerHTML
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
        ('✅ Floating button created');
        return button;
    };

    // Create modal overlay
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

        // Modal container
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

        // Modal content - create using DOM methods to avoid CSP issues
        const modalContent = document.createElement('div');
        Object.assign(modalContent.style, {
            padding: '28px 24px 24px 24px',
            color: '#1a1a1a'
        });

        // Header
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

        // Button container
        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '24px'
        });

        // Create buttons
        const buttons = [
            { id: 'sabkisoch-store-btn', text: 'Store Current Chat', isDanger: false },
            { id: 'sabkisoch-load-btn', text: 'Generate & Send Context', isDanger: false },
            { id: 'sabkisoch-inject-btn', text: 'Load Context to Chat', isDanger: false },
            { id: 'sabkisoch-clear-btn', text: 'Clear My Data', isDanger: true }
        ];

        buttons.forEach(btnData => {
            const button = document.createElement('button');
            button.id = btnData.id;
            button.textContent = btnData.text;

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

        // Help text
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
            { strong: 'Generate & Send Context', text: ' to create intelligent context summary and send to AI' },
            { strong: 'Load Context to Chat', text: ' to inject context into chat input (manual send)' }
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

        // Status div
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

        // Footer
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

        // Assemble modal content
        modalContent.appendChild(header);
        modalContent.appendChild(buttonContainer);
        modalContent.appendChild(helpText);
        modalContent.appendChild(statusDiv);
        modalContent.appendChild(footer);

        modal.appendChild(modalContent);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                toggleModal();
            }
        });

        // Add button hover effects
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

        // Connect button actions
        connectButtonActions();

        ('✅ Modal created');
        return overlay;
    };

    // Toggle modal visibility
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
            ('✅ Modal opened');
        } else {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.9)';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
            ('✅ Modal closed');
        }
    };

    // Connect button actions to content script
    const connectButtonActions = () => {
        document.getElementById('sabkisoch-store-btn').addEventListener('click', () => {
            setButtonLoading('sabkisoch-store-btn', 'Storing...');
            // Send message to content script via window.postMessage
            window.postMessage({
                type: 'SABKI_SOCH_ACTION',
                action: 'store_context'
            }, '*');
        });

        document.getElementById('sabkisoch-load-btn').addEventListener('click', () => {
            setButtonLoading('sabkisoch-load-btn', 'Generating...');
            window.postMessage({
                type: 'SABKI_SOCH_ACTION',
                action: 'load_context'
            }, '*');
        });

        document.getElementById('sabkisoch-inject-btn').addEventListener('click', () => {
            setButtonLoading('sabkisoch-inject-btn', 'Loading...');
            window.postMessage({
                type: 'SABKI_SOCH_ACTION',
                action: 'inject_context'
            }, '*');
        });

        document.getElementById('sabkisoch-clear-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all stored data?')) {
                setButtonLoading('sabkisoch-clear-btn', 'Clearing...');
                window.postMessage({
                    type: 'SABKI_SOCH_ACTION',
                    action: 'clear_data'
                }, '*');
            }
        });
    };

    // Button loading state management
    const setButtonLoading = (buttonId, loadingText) => {
        const button = document.getElementById(buttonId);
        if (!button) return;

        // Store original text
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

    // Listen for responses from content script
    window.addEventListener('message', (event) => {
        if (!event.data || event.data.type !== 'SABKI_SOCH_RESPONSE') return;

        const { action, success, message } = event.data;

        // Update button states based on action
        if (action === 'store_context') {
            if (success) {
                setButtonSuccess('sabkisoch-store-btn', '✅ Stored!');
            } else {
                setButtonError('sabkisoch-store-btn', '❌ Failed');
            }
        } else if (action === 'load_context') {
            if (success) {
                setButtonSuccess('sabkisoch-load-btn', '✅ Sent!');
                // Auto-close modal on successful load
                setTimeout(() => {
                    toggleModal();
                }, 1500);
            } else {
                setButtonError('sabkisoch-load-btn', '❌ Failed');
            }
        } else if (action === 'inject_context') {
            if (success) {
                setButtonSuccess('sabkisoch-inject-btn', '✅ Loaded!');
            } else {
                setButtonError('sabkisoch-inject-btn', '❌ Failed');
            }
        } else if (action === 'clear_data') {
            if (success) {
                setButtonSuccess('sabkisoch-clear-btn', '✅ Cleared!');
                // Auto-close modal on successful clear
                setTimeout(() => {
                    toggleModal();
                }, 1500);
            } else {
                setButtonError('sabkisoch-clear-btn', '❌ Failed');
            }
        }

        showStatus(success ? 'success' : 'error', message);
    });

    // Show status message
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

    // Initialize UI components
    const initUI = () => {
        try {
            createFloatingButton();
            createModal();
            ('✅ SabkiSoch UI components initialized');
        } catch (error) {
            console.error('❌ Failed to initialize UI:', error);
        }
    };

    // Listen for keyboard shortcut (Ctrl+Shift+S)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            toggleModal();
            ('⌨️ Keyboard shortcut triggered');
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }

    // Expose toggle function globally for content.js to use
    window.__SABKI_SOCH_TOGGLE_MODAL__ = toggleModal;

})();