const shortcuts = {
    MAX_SHORTCUTS: 12,

    validateAndFormatUrl: (url) => {
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        
        try {
            new URL(url);
            return url;
        } catch (e) {
            return false;
        }
    },

    add: (url, name) => {
        const currentShortcuts = Storage.get('shortcuts') || [];
        if (currentShortcuts.length >= shortcuts.MAX_SHORTCUTS) {
            notifications.show('Maximum shortcuts limit reached!', 'error');
            return;
        }
        
        const formattedUrl = shortcuts.validateAndFormatUrl(url);
        if (!formattedUrl) {
            notifications.show('Invalid URL format!', 'error');
            return;
        }
        
        currentShortcuts.push({ url: formattedUrl, name });
        Storage.set('shortcuts', currentShortcuts);
        shortcuts.render();
        CacheUpdater.update();
    },

    remove: (index) => {
        const currentShortcuts = Storage.get('shortcuts') || [];
        currentShortcuts.splice(index, 1);
        Storage.set('shortcuts', currentShortcuts);
        shortcuts.render();
        notifications.show('Shortcut removed!', 'success');
        CacheUpdater.update();
    },

    edit: (index, newUrl, newName) => {
        const currentShortcuts = Storage.get('shortcuts') || [];
        currentShortcuts[index] = { url: newUrl, name: newName };
        Storage.set('shortcuts', currentShortcuts);
        shortcuts.render();
        notifications.show('Shortcut updated!', 'success');
        CacheUpdater.update();
    },

    showContextMenu: (e, index) => {
        e.preventDefault();
        const menu = document.getElementById('context-menu');
        const rect = e.target.getBoundingClientRect();
        
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;
        menu.classList.remove('hidden');
        menu.dataset.shortcutIndex = index;
        
        const handleClickOutside = (event) => {
            if (!menu.contains(event.target)) {
                menu.classList.add('hidden');
                document.removeEventListener('click', handleClickOutside);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
    },

    render: () => {
        const grid = document.getElementById('shortcuts-grid');
        const currentShortcuts = Storage.get('shortcuts') || [];
        const isAnonymous = Storage.get('anonymousMode') || false;
        
        grid.innerHTML = '';
        
        currentShortcuts.forEach((shortcut, index) => {
            const element = document.createElement('div');
            element.className = `shortcut ${isAnonymous ? 'blurred' : ''}`;
            
            element.dataset.index = index;
            
            const icon = document.createElement('img');
            icon.src = `https://www.google.com/s2/favicons?domain=${shortcut.url}&sz=64`;
            icon.alt = shortcut.name;
            icon.draggable = false;
            
            const name = document.createElement('span');
            name.textContent = shortcut.name;
            
            element.appendChild(icon);
            element.appendChild(name);
            
            element.addEventListener('click', (e) => {
                if (!grid.classList.contains('grid-draggable') || !e.target.closest('.shortcut').classList.contains('drag-active')) {
                    if (e.ctrlKey) {
                        window.open(shortcut.url, '_blank');
                    } else {
                        window.location.href = shortcut.url;
                    }
                }
            });
            
            element.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const menu = document.getElementById('context-menu');
                
                menu.style.top = `${e.pageY}px`;
                menu.style.left = `${e.pageX}px`;
                menu.classList.remove('hidden');
                menu.dataset.shortcutIndex = index;
                
                const closeMenu = (event) => {
                    if (!menu.contains(event.target)) {
                        menu.classList.add('hidden');
                        document.removeEventListener('click', closeMenu);
                    }
                };
                
                setTimeout(() => {
                    document.addEventListener('click', closeMenu);
                }, 0);
            });
            
            grid.appendChild(element);
        });
    },

    init: () => {
        const addShortcutButton = document.getElementById('add-shortcut');
        const modal = document.getElementById('add-shortcut-modal');
        const closeBtn = modal.querySelector('.close-modal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    document.getElementById('shortcut-url').value = '';
                    document.getElementById('shortcut-name').value = '';
                }, 300);
            });
        }
        
        if (addShortcutButton) {
            addShortcutButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentShortcuts = Storage.get('shortcuts') || [];

                if (currentShortcuts.length >= shortcuts.MAX_SHORTCUTS) {
                    notifications.show('Maximum shortcuts limit reached!', 'error');
                    return;
                }

                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('active');
                    
                    const urlInput = document.getElementById('shortcut-url');
                    const nameInput = document.getElementById('shortcut-name');
                    
                    const saveShortcutButton = document.getElementById('save-shortcut');
                    if (saveShortcutButton) {
                        saveShortcutButton.onclick = () => {
                            const url = urlInput.value.trim();
                            const name = nameInput.value.trim();
                            
                            if (url && name) {
                                try {
                                    new URL(url);
                                    shortcuts.add(url, name);
                                    modal.classList.remove('active');
                                    setTimeout(() => {
                                        modal.classList.add('hidden');
                                        urlInput.value = '';
                                        nameInput.value = '';
                                    }, 300);
                                    notifications.show('Shortcut added successfully!', 'success');
                                } catch (e) {
                                    notifications.show('Invalid URL format!', 'error');
                                }
                            }
                        };
                    }
                    
                    const cancelShortcutButton = document.getElementById('cancel-shortcut');
                    if (cancelShortcutButton) {
                        cancelShortcutButton.onclick = () => {
                            modal.classList.remove('active');
                            setTimeout(() => {
                                modal.classList.add('hidden');
                                urlInput.value = '';
                                nameInput.value = '';
                            }, 300);
                        };
                    }
                }
            });
        }
        
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) {
            contextMenu.addEventListener('click', (e) => {
                const action = e.target.closest('.context-menu-item')?.dataset.action;
                const index = parseInt(contextMenu.dataset.shortcutIndex);
                
                if (action === 'edit') {
                    const currentShortcuts = Storage.get('shortcuts') || [];
                    const shortcut = currentShortcuts[index];
                    const modal = document.getElementById('edit-shortcut-modal');
                    
                    if (modal) {
                        const urlInput = document.getElementById('edit-shortcut-url');
                        const nameInput = document.getElementById('edit-shortcut-name');
                        
                        urlInput.value = shortcut.url;
                        nameInput.value = shortcut.name;
                        
                        modal.classList.remove('hidden');
                        modal.classList.add('active');
                        
                        const saveButton = document.getElementById('save-edit-shortcut');
                        const closeButton = document.getElementById('close-edit-shortcut');
                        const cancelButton = document.getElementById('cancel-edit-shortcut');
                        
                        const closeModal = () => {
                            modal.classList.remove('active');
                            setTimeout(() => {
                                modal.classList.add('hidden');
                            }, 300);
                        };
                        
                        const handleSave = () => {
                            const newUrl = urlInput.value.trim();
                            const newName = nameInput.value.trim();
                            
                            if (newUrl && newName) {
                                const formattedUrl = shortcuts.validateAndFormatUrl(newUrl);
                                if (formattedUrl) {
                                    shortcuts.edit(index, formattedUrl, newName);
                                    closeModal();
                                } else {
                                    notifications.show('Invalid URL format!', 'error');
                                }
                            }
                        };
                        
                        saveButton.onclick = handleSave;
                        closeButton.onclick = closeModal;
                        cancelButton.onclick = closeModal;
                    }
                } else if (action === 'delete') {
                    shortcuts.remove(index);
                } else if (action === 'open-new-tab') {
                    const currentShortcuts = Storage.get('shortcuts') || [];
                    const shortcut = currentShortcuts[index];

                    if (shortcut && shortcut.url) {
                        window.open(shortcut.url, '_blank');
                    }
                }
                
                contextMenu.classList.add('hidden');
            });
        }
        
        shortcuts.render();
    }
};