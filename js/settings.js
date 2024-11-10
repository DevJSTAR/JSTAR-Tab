// Anonymous name generator
const anonymousNames = {
    adjectives: ['Hidden', 'Secret', 'Mystery', 'Shadow', 'Unknown', 'Silent', 'Stealth', 'Phantom', 'Ghost', 'Anon'],
    nouns: [' User', ' Visitor', ' Guest', ' Agent', ' Entity', ' Person', ' Browser', ' Explorer', ' Wanderer', ' Navigator'],
    
    generate: function() {
        const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
        const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
        return `${adjective}${noun}`;
    }
};

// Main settings object
const settings = {
    // Toggle between light and dark themes
    toggleTheme: () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        Storage.set('theme', newTheme);
        
        const themeIcon = document.querySelector('#toggle-theme i');
        themeIcon.className = `fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}`;
    },

    // Toggle anonymous mode
    toggleAnonymousMode: () => {
        const isAnonymous = Storage.get('anonymousMode') || false;
        Storage.set('anonymousMode', !isAnonymous);
        
        if (!isAnonymous) {
            const randomName = anonymousNames.generate();
            Storage.set('anonymousName', randomName);
            notifications.show('Anonymous mode enabled!', 'info');
        } else {
            Storage.remove('anonymousName');
            notifications.show('Anonymous mode disabled!', 'info');
        }
        
        shortcuts.render();
        updateGreeting();
    },

    // Update the search engine
    updateSearchEngine: (engine) => {
        Storage.set('searchEngine', engine);
        notifications.show('Search engine updated successfully!', 'success');
    },
    
    // Update visibility of UI elements
    updateVisibility: () => {
        const elements = {
            greeting: {
                id: 'greeting',
                toggle: 'toggle-greeting',
                functions: ['updateGreeting'],
                name: 'Greeting'
            },
            search: {
                id: 'search-container',
                toggle: 'toggle-search',
                functions: ['search.init', 'search.perform'],
                name: 'Search bar'
            },
            shortcuts: {
                id: 'shortcuts-grid',
                toggle: 'toggle-shortcuts',
                functions: ['shortcuts.init', 'shortcuts.render'],
                name: 'Shortcuts'
            },
            addShortcut: {
                id: 'add-shortcut',
                toggle: 'toggle-add-shortcut',
                functions: [],
                name: 'Add shortcut button'
            }
        };

        Object.entries(elements).forEach(([key, element]) => {
            const isVisible = Storage.get(`show_${key}`);
            if (isVisible === null) Storage.set(`show_${key}`, true);
            
            const toggle = document.getElementById(element.toggle);
            const elementNode = document.getElementById(element.id);
            
            if (toggle && elementNode) {
                toggle.checked = isVisible !== false;
                if (isVisible === false) {
                    elementNode.style.visibility = 'hidden';
                    elementNode.style.opacity = '0';
                    elementNode.style.position = 'absolute';
                    elementNode.style.pointerEvents = 'none';
                }
                
                toggle.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    Storage.set(`show_${key}`, isChecked);
                    
                    if (isChecked) {
                        elementNode.style.visibility = 'visible';
                        elementNode.style.opacity = '1';
                        elementNode.style.position = 'relative';
                        elementNode.style.pointerEvents = 'auto';
                    } else {
                        elementNode.style.visibility = 'hidden';
                        elementNode.style.opacity = '0';
                        elementNode.style.position = 'absolute';
                        elementNode.style.pointerEvents = 'none';
                    }
                    
                    if (key === 'shortcuts') {
                        const addShortcutBtn = document.getElementById('add-shortcut');
                        const addShortcutVisible = Storage.get('show_addShortcut') !== false;
                        
                        if (addShortcutBtn && !isChecked && !addShortcutVisible) {
                            addShortcutBtn.style.visibility = 'hidden';
                            addShortcutBtn.style.opacity = '0';
                            addShortcutBtn.style.position = 'absolute';
                            addShortcutBtn.style.pointerEvents = 'none';
                        } else if (addShortcutBtn && addShortcutVisible) {
                            addShortcutBtn.style.visibility = 'visible';
                            addShortcutBtn.style.opacity = '1';
                            addShortcutBtn.style.position = 'relative';
                            addShortcutBtn.style.pointerEvents = 'auto';
                        }
                    }

                    notifications.show(
                        `${element.name} ${isChecked ? 'shown' : 'hidden'}!`,
                        isChecked ? 'success' : 'info'
                    );
                });
            }
        });
    },

    // Initialize settings
    init: () => {
        const settingsButton = document.getElementById('settings-button');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');
        
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const userName = Storage.get('userName') || '';
            const isAnonymous = Storage.get('anonymousMode') || false;
            const currentEngine = Storage.get('searchEngine') || 'google';
            
            document.getElementById('settings-name').value = userName;
            document.getElementById('toggle-anonymous').checked = isAnonymous;
            document.getElementById('search-engine-select').value = currentEngine;
            
            settingsModal.classList.remove('hidden');
            settingsModal.classList.add('active');
        });
        
        closeSettings.addEventListener('click', () => {
            settingsModal.classList.remove('active');
            setTimeout(() => {
                settingsModal.classList.add('hidden');
            }, 300);
        });
        
        const themeToggle = document.getElementById('toggle-theme');
        themeToggle.addEventListener('click', settings.toggleTheme);
        
        const anonymousToggle = document.getElementById('toggle-anonymous');
        anonymousToggle.addEventListener('change', settings.toggleAnonymousMode);
        
        const searchEngineSelect = document.getElementById('search-engine-select');
        searchEngineSelect.addEventListener('change', (e) => {
            settings.updateSearchEngine(e.target.value);
        });
        
        const nameInput = document.getElementById('settings-name');
        nameInput.addEventListener('change', (e) => {
            const newName = e.target.value.trim();
            if (newName) {
                Storage.set('userName', newName);
                updateGreeting();
                notifications.show('Name updated successfully!', 'success');
            }
        });
        
        const savedTheme = Storage.get('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        const themeIcon = document.querySelector('#toggle-theme i');
        themeIcon.className = `fas fa-${savedTheme === 'dark' ? 'sun' : 'moon'}`;
        
        settings.initDataManagement();
        settings.updateVisibility();
    }
};

// Initialize data management
settings.initDataManagement = () => {
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    const resetBtn = document.getElementById('reset-data');
    const fileInput = document.getElementById('import-file');

    // Export Data
    exportBtn.addEventListener('click', () => {
        try {
            const data = {
                settings: {
                    theme: Storage.get('theme'),
                    userName: Storage.get('userName'),
                    anonymousMode: Storage.get('anonymousMode'),
                    anonymousName: Storage.get('anonymousName'),
                    searchEngine: Storage.get('searchEngine'),
                    show_greeting: Storage.get('show_greeting'),
                    show_search: Storage.get('show_search'),
                    show_shortcuts: Storage.get('show_shortcuts'),
                    show_addShortcut: Storage.get('show_addShortcut')
                },
                shortcuts: Storage.get('shortcuts') || []
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jstar-tab-backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            notifications.show('Data exported successfully!', 'success');
        } catch (error) {
            notifications.show('Failed to export data!', 'error');
            console.error('Export error:', error);
        }
    });

    // Import Data
    importBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!data.shortcuts || !data.settings) {
                    throw new Error('Invalid backup file format');
                }

                Object.entries(data.settings).forEach(([key, value]) => {
                    Storage.set(key, value);
                });

                Storage.set('shortcuts', data.shortcuts);

                fileInput.value = '';

                ['greeting', 'search', 'shortcuts', 'addShortcut'].forEach(element => {
                    const isVisible = data.settings[`show_${element}`];
                    const elementNode = document.getElementById(element === 'search' ? 'search-container' : element);
                    const toggle = document.getElementById(`toggle-${element}`);
                    
                    if (elementNode && toggle) {
                        toggle.checked = isVisible !== false;
                        if (isVisible === false) {
                            elementNode.style.visibility = 'hidden';
                            elementNode.style.opacity = '0';
                            elementNode.style.position = 'absolute';
                            elementNode.style.pointerEvents = 'none';
                        } else {
                            elementNode.style.visibility = 'visible';
                            elementNode.style.opacity = '1';
                            elementNode.style.position = 'relative';
                            elementNode.style.pointerEvents = 'auto';
                        }
                    }
                });

                const shortcutsVisible = data.settings.show_shortcuts !== false;
                const addShortcutVisible = data.settings.show_addShortcut !== false;
                const addShortcutBtn = document.getElementById('add-shortcut');

                if (addShortcutBtn) {
                    if (!shortcutsVisible && !addShortcutVisible) {
                        addShortcutBtn.style.visibility = 'hidden';
                        addShortcutBtn.style.opacity = '0';
                        addShortcutBtn.style.position = 'absolute';
                        addShortcutBtn.style.pointerEvents = 'none';
                    } else if (addShortcutVisible) {
                        addShortcutBtn.style.visibility = 'visible';
                        addShortcutBtn.style.opacity = '1';
                        addShortcutBtn.style.position = 'relative';
                        addShortcutBtn.style.pointerEvents = 'auto';
                    }
                }

                shortcuts.render();
                updateGreeting();
                document.body.setAttribute('data-theme', data.settings.theme || 'light');

                notifications.show('Data imported successfully!', 'success');
            } catch (error) {
                notifications.show('Failed to import data: Invalid file format!', 'error');
                console.error('Import error:', error);
            }
        };

        reader.onerror = () => {
            notifications.show('Failed to read file!', 'error');
        };

        reader.readAsText(file);
    });

    // Reset Data
    resetBtn.addEventListener('click', () => {
        const confirmReset = confirm('Are you sure you want to reset all data? This action cannot be undone.');
        
        if (confirmReset) {
            try {
                Storage.clear();
                closeModal(document.getElementById('settings-modal'));
                notifications.show('All data has been reset!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (error) {
                notifications.show('Failed to reset data!', 'error');
                console.error('Reset error:', error);
            }
        }
    });
};