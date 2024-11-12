// List of keys that cannot be used as keybinds
const FORBIDDEN_KEYS = [
    'Tab', 'CapsLock', 'Meta', 'ContextMenu',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete', 'ScrollLock', 'Pause', 'NumLock'
];

const keybinds = {
    bindings: {},

    init() {
        this.bindings = Storage.get('keybinds') || {};
        
        // URL keybind handling
        const urlInput = document.getElementById('keybind-url');
        const urlComboInput = document.getElementById('keybind-url-combo');

        if (this.bindings.url) {
            urlInput.value = this.bindings.url.url || '';
            urlComboInput.value = this.bindings.url.keys || '';
        }

        let lastSavedUrl = urlInput.value;

        function isValidUrl(string) {
            try {
                const urlString = string.match(/^https?:\/\//) ? string : `https://${string}`;
                new URL(urlString);
                return true;
            } catch (_) {
                return false;
            }
        }

        urlInput.addEventListener('input', () => {
            if (!this.bindings.url) {
                this.bindings.url = { url: '', keys: '' };
            }
            this.bindings.url.url = urlInput.value;
            Storage.set('keybinds', this.bindings);
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                urlInput.blur();
            }
        });

        urlInput.addEventListener('blur', () => {
            const currentUrl = urlInput.value.trim();
            
            if (currentUrl === lastSavedUrl) {
                return;
            }

            if (currentUrl) {
                if (isValidUrl(currentUrl)) {
                    lastSavedUrl = currentUrl;
                    notifications.show('URL saved.', 'success');
                } else {
                    notifications.show('Please enter a valid URL.', 'error');
                    urlInput.value = lastSavedUrl;
                    this.bindings.url.url = lastSavedUrl;
                    Storage.set('keybinds', this.bindings);
                }
            }
        });

        // Keybind input handling
        const keybindInputs = document.querySelectorAll('[id^="keybind-"]');
        keybindInputs.forEach(input => {
            if (input.id === 'keybind-url') {
                const urlBinding = this.bindings['url'];
                if (urlBinding && urlBinding.url) {
                    input.value = urlBinding.url;
                }
                
                input.addEventListener('input', () => {
                    if (this.bindings['url']) {
                        this.bindings['url'].url = input.value;
                        Storage.set('keybinds', this.bindings);
                    }
                });
                return;
            }
            
            const action = input.id.replace('keybind-url-combo', 'url').replace('keybind-', '');
            if (this.bindings[action]) {
                input.value = this.bindings[action].keys;
            }

            let currentKeys = new Set();
            let isProcessingKeybind = false;
            
            input.addEventListener('keydown', (e) => {
                e.preventDefault();
                
                if (e.key === 'Escape') {
                    input.blur();
                    return;
                }

                if (e.ctrlKey) {
                    notifications.show('CTRL key combinations are not allowed.', 'error');
                    isProcessingKeybind = true;
                    return;
                }

                if (FORBIDDEN_KEYS.includes(e.key)) {
                    notifications.show('This key cannot be used as a keybind.', 'error');
                    isProcessingKeybind = true;
                    return;
                }

                isProcessingKeybind = false;
                
                if (e.key !== 'Alt' && e.key !== 'Shift') {
                    currentKeys.add(e.key);
                }
                if (e.altKey) currentKeys.add('Alt');
                if (e.shiftKey) currentKeys.add('Shift');

                input.value = Array.from(currentKeys).join('+');
            });

            input.addEventListener('keyup', (e) => {
                if (isProcessingKeybind) {
                    currentKeys.clear();
                    return;
                }

                if (e.key === 'Alt' || e.key === 'Shift') {
                    if (currentKeys.size === 1) {
                        notifications.show('Add another key with Alt or Shift.', 'error');
                    }
                    currentKeys.clear();
                    input.value = this.bindings[action]?.keys || '';
                    return;
                }
                
                const combo = Array.from(currentKeys).join('+');
                
                if (!combo) return;

                const duplicate = Object.entries(this.bindings).find(([key, value]) => 
                    value.keys === combo && key !== action
                );

                if (duplicate) {
                    notifications.show('This keybind is already in use.', 'error');
                    currentKeys.clear();
                    input.value = this.bindings[action]?.keys || '';
                    return;
                }

                this.bindings[action] = {
                    keys: combo,
                    url: action === 'url' ? document.getElementById('keybind-url').value : null
                };
                Storage.set('keybinds', this.bindings);
                notifications.show('Keybind saved.', 'success');
            });

            input.addEventListener('blur', () => {
                currentKeys.clear();
                input.value = this.bindings[action]?.keys || '';
            });
        });

        // Clear keybind button handling
        document.querySelectorAll('.clear-keybind').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.for;
                const input = document.getElementById(`keybind-${action}-combo`) || 
                             document.getElementById(`keybind-${action}`);
                
                input.value = '';
                if (action === 'url') {
                    document.getElementById('keybind-url').value = '';
                }
                
                delete this.bindings[action];
                Storage.set('keybinds', this.bindings);
                notifications.show('Keybind removed.', 'success');
            });
        });

        // Global keybind listener
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            const keys = [];
            if (e.altKey) keys.push('Alt');
            if (e.shiftKey) keys.push('Shift');
            if (e.key !== 'Alt' && e.key !== 'Shift') keys.push(e.key);

            const combo = keys.join('+');

            Object.entries(this.bindings).forEach(([action, binding]) => {
                if (binding.keys === combo) {
                    e.preventDefault();
                    this.executeAction(action, binding);
                }
            });
        });
    },

    // Execute the action associated with a keybind
    executeAction(action, binding) {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal);
        }

        switch (action) {
            case 'settings':
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal === activeModal) {
                    notifications.show('Settings closed.', 'info');
                    settings.updateSettingsUI();
                } else {
                    notifications.show('Opening settings...', 'info');
                    settings.updateSettingsUI();
                    openModal(settingsModal);
                }
                break;
            case 'add-shortcut':
                const currentShortcuts = Storage.get('shortcuts') || [];
            if (currentShortcuts.length >= shortcuts.MAX_SHORTCUTS) {
                notifications.show('Maximum shortcuts limit reached!', 'error');
                return;
            }
            
            const shortcutModal = document.getElementById('add-shortcut-modal');
            if (shortcutModal === activeModal) {
                notifications.show('Add shortcut closed.', 'info');
            } else {
                notifications.show('Opening add shortcut...', 'info');
                openModal(shortcutModal);
            }
                break;
            case 'anonymous':
                settings.toggleAnonymousMode();
                break;
            case 'theme':
                settings.toggleTheme();
                break;
            case 'url':
                if (binding.url) {
                    const url = binding.url;
                    const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? 
                        url : `https://${url}`;
                        
                    notifications.show(`Redirecting to ${url}...`, 'info');
                    setTimeout(() => {
                        window.location.href = fullUrl;
                    }, 1000);
                } else {
                    notifications.show('No URL set for this keybind.', 'error');
                }
                break;
        }
    }
};
