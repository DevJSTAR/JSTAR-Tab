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

    add: (url, name, isPasswordProtected = false) => {
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
        
        currentShortcuts.push({ 
            url: formattedUrl, 
            name,
            isPasswordProtected: isPasswordProtected || false
        });
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

    showConfirmDialog: (title, message, onConfirm) => {
        const dialog = document.getElementById('confirmation-dialog');
        const titleEl = document.getElementById('confirmation-title');
        const messageEl = document.getElementById('confirmation-message');
        const confirmBtn = document.getElementById('confirm-action');
        const cancelBtn = document.getElementById('cancel-action');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        dialog.classList.remove('hidden');
        setTimeout(() => dialog.classList.add('active'), 10);
        
        const closeDialog = () => {
            dialog.classList.remove('active');
            setTimeout(() => dialog.classList.add('hidden'), 300);
        };
        
        const handleConfirm = () => {
            onConfirm();
            closeDialog();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            closeDialog();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    },
    
    showPasswordDialog: (shortcut, callback) => {
        const dialog = document.getElementById('password-dialog');
        const passwordInput = document.getElementById('shortcut-password');
        const submitBtn = document.getElementById('submit-password');
        const cancelBtn = document.getElementById('cancel-password');
        const closeBtn = document.getElementById('close-password-dialog');
        const errorMsg = document.getElementById('password-error');
        const contextMenu = document.getElementById('context-menu');
        
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }
        
        if (errorMsg) {
            errorMsg.classList.add('hidden');
        }
        
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        if (dialog) {
            dialog.classList.remove('hidden');
            setTimeout(() => {
                dialog.classList.add('active');
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, 10);
        }
        
        const closeDialog = () => {
            dialog.classList.remove('active');
            setTimeout(() => dialog.classList.add('hidden'), 300);
        };
        
        const handleSubmit = () => {
            const password = passwordInput.value;
            const masterPassword = Storage.get('masterPassword');
            
            if (!masterPassword) {
                errorMsg.textContent = "No master password set. Please set one in settings.";
                errorMsg.classList.remove('hidden');
                return;
            }
            
            if (password === masterPassword) {
                closeDialog();
                callback();
                submitBtn.removeEventListener('click', handleSubmit);
                cancelBtn.removeEventListener('click', handleCancel);
                closeBtn.removeEventListener('click', handleCancel);
                passwordInput.removeEventListener('keydown', handleKeydown);
            } else {
                errorMsg.textContent = "Incorrect password. Please try again.";
                errorMsg.classList.remove('hidden');
                passwordInput.value = '';
                passwordInput.focus();
            }
        };
        
        const handleCancel = () => {
            closeDialog();
            submitBtn.removeEventListener('click', handleSubmit);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
            passwordInput.removeEventListener('keydown', handleKeydown);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        submitBtn.addEventListener('click', handleSubmit);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);
        passwordInput.addEventListener('keydown', handleKeydown);
    },

    edit: (index, newUrl, newName, isPasswordProtected) => {
        const currentShortcuts = Storage.get('shortcuts') || [];
        currentShortcuts[index] = { 
            url: newUrl, 
            name: newName,
            isPasswordProtected: isPasswordProtected || false
        };
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
            element.className = `shortcut ${isAnonymous ? 'blurred' : ''} ${shortcut.isPasswordProtected ? 'password-protected' : ''}`;
            
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
                    if (shortcut.isPasswordProtected) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const openShortcut = () => {
                            if (e.ctrlKey || e.which === 2 || e.button === 1) {
                                window.open(shortcut.url, '_blank');
                            } else {
                                window.location.href = shortcut.url;
                            }
                        };
                        
                        shortcuts.showPasswordDialog(shortcut, openShortcut);
                        return false;
                    } else {
                        if (e.ctrlKey || e.which === 2 || e.button === 1) {
                        window.open(shortcut.url, '_blank');
                    } else {
                        window.location.href = shortcut.url;
                        }
                    }
                }
            });
            
            element.addEventListener('mousedown', (e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    
                    if (shortcut.isPasswordProtected) {
                        const openShortcut = () => {
                            window.open(shortcut.url, '_blank');
                        };
                        
                        shortcuts.showPasswordDialog(shortcut, openShortcut);
                    } else {
                        window.open(shortcut.url, '_blank');
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
        const masterPasswordInput = document.getElementById('master-password');
        if (masterPasswordInput) {
            const savedPassword = Storage.get('masterPassword');
            if (savedPassword) {
                masterPasswordInput.value = savedPassword;
            }
        }
        
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
                                    
                                    const isPasswordProtectionEnabled = Storage.get('passwordProtectionEnabled') || false;
                                    const passwordProtectCheckbox = document.getElementById('protect-shortcut');
                                    const isPasswordProtected = isPasswordProtectionEnabled && passwordProtectCheckbox && passwordProtectCheckbox.checked;
                                    
                                    shortcuts.add(url, name, isPasswordProtected);
                                    modal.classList.remove('active');
                                    setTimeout(() => {
                                        modal.classList.add('hidden');
                                        urlInput.value = '';
                                        nameInput.value = '';
                                        if (passwordProtectCheckbox) passwordProtectCheckbox.checked = false;
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
                                const passwordProtectCheckbox = document.getElementById('protect-shortcut');
                                if (passwordProtectCheckbox) passwordProtectCheckbox.checked = false;
                            }, 300);
                        };
                    }
                }
            });
        }
        
        const anonymousTogglePrivacy = document.getElementById('toggle-anonymous-privacy');
        if (anonymousTogglePrivacy) {
            anonymousTogglePrivacy.checked = Storage.get('anonymousMode') || false;
            
            anonymousTogglePrivacy.addEventListener('change', () => {
                const anonymousToggle = document.getElementById('toggle-anonymous');
                if (anonymousToggle) {
                    anonymousToggle.checked = anonymousTogglePrivacy.checked;
                    anonymousToggle.dispatchEvent(new Event('change'));
                } else {
                    shortcuts.toggleAnonymousMode();
                }
            });
        }
        
        const shortcutsPasswordToggle = document.getElementById('toggle-shortcuts-password');
        if (shortcutsPasswordToggle) {
            const isEnabled = Storage.get('passwordProtectionEnabled') || false;
            shortcutsPasswordToggle.checked = isEnabled;
            const passwordSettings = document.getElementById('password-protection-settings');
            
            if (passwordSettings) {
                if (isEnabled) {
                    passwordSettings.classList.remove('hidden');
                } else {
                    passwordSettings.classList.add('hidden');
                }
            }
            
            shortcutsPasswordToggle.addEventListener('change', () => {
                const isEnabled = shortcutsPasswordToggle.checked;
                Storage.set('passwordProtectionEnabled', isEnabled);
                
                if (passwordSettings) {
                    if (isEnabled) {
                        passwordSettings.classList.remove('hidden');
                    } else {
                        passwordSettings.classList.add('hidden');
                    }
                }
                
                shortcuts.updateAddShortcutModal();
                
                if (isEnabled) {
                    const masterPassword = Storage.get('masterPassword');
                    
                    if (!masterPassword) {
                        const masterPasswordInput = document.getElementById('master-password');
                        if (masterPasswordInput) {
                            masterPasswordInput.focus();
                            notifications.show('Please set a master password!', 'warning');
                        }
                    } else {
                        notifications.show('Password protection enabled!', 'success');
                        
                        setTimeout(() => {
                            shortcuts.createShortcutProtectionManager();
                        }, 10);
                    }
                } else {
                    const currentShortcuts = Storage.get('shortcuts') || [];
                    currentShortcuts.forEach(shortcut => {
                        shortcut.isPasswordProtected = false;
                    });
                    Storage.set('shortcuts', currentShortcuts);
                    shortcuts.render();
                    
                    notifications.show('Password protection disabled!', 'info');
                }
            });
        }
        
        if (Storage.get('passwordProtectionEnabled')) {
            shortcuts.createShortcutProtectionManager();
        }
        
        const saveMasterPasswordBtn = document.getElementById('save-master-password');
        if (saveMasterPasswordBtn) {
            saveMasterPasswordBtn.addEventListener('click', () => {
                const masterPasswordInput = document.getElementById('master-password');
                if (masterPasswordInput) {
                    const password = masterPasswordInput.value.trim();
                    
                    if (password) {
                        Storage.set('masterPassword', password);
                        
                        notifications.show('Master password updated!', 'success');
                        
                        const shortcutsPasswordToggle = document.getElementById('toggle-shortcuts-password');
                        if (shortcutsPasswordToggle && !shortcutsPasswordToggle.checked) {
                            shortcutsPasswordToggle.checked = true;
                            Storage.set('passwordProtectionEnabled', true);
                            const passwordSettings = document.getElementById('password-protection-settings');
                            if (passwordSettings) {
                                passwordSettings.classList.remove('hidden');
                            }
                            shortcuts.updateAddShortcutModal();
                            
                            setTimeout(() => {
                                shortcuts.createShortcutProtectionManager();
                            }, 10);
                        } else {
                            setTimeout(() => {
                                shortcuts.createShortcutProtectionManager();
                            }, 10);
                        }
                    } else {
                        notifications.show('Please enter a valid password!', 'error');
                    }
                }
            });
        }
        
        shortcuts.updateAddShortcutModal();
        
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
                        
                        const protectCheckbox = document.getElementById('protect-shortcut-edit');
                        if (protectCheckbox) {
                            protectCheckbox.checked = shortcut.isPasswordProtected || false;
                        }
                        
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
                                    const isPasswordProtectionEnabled = Storage.get('passwordProtectionEnabled') || false;
                                    const isPasswordProtected = isPasswordProtectionEnabled && 
                                        protectCheckbox && protectCheckbox.checked;
                                    
                                    shortcuts.edit(index, formattedUrl, newName, isPasswordProtected);
                                    closeModal();
                                    
                                    shortcuts.createShortcutProtectionManager();
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
                    const currentShortcuts = Storage.get('shortcuts') || [];
                    const shortcut = currentShortcuts[index];
                    
                    shortcuts.showConfirmDialog(
                        'Delete Shortcut',
                        `Are you sure you want to delete "${shortcut.name}"?`,
                        () => {
                    shortcuts.remove(index);
                            shortcuts.createShortcutProtectionManager();
                        }
                    );
                } else if (action === 'open-new-tab') {
                    const currentShortcuts = Storage.get('shortcuts') || [];
                    const shortcut = currentShortcuts[index];

                    if (shortcut && shortcut.url) {
                        if (shortcut.isPasswordProtected) {
                            shortcuts.showPasswordDialog(shortcut, () => {
                                window.open(shortcut.url, '_blank');
                            });
                        } else {
                        window.open(shortcut.url, '_blank');
                        }
                    }
                }
                
                contextMenu.classList.add('hidden');
            });
        }
        
        shortcuts.render();
    },
    
    createShortcutProtectionManager: () => {
        const passwordSettings = document.getElementById('password-protection-settings');
        if (!passwordSettings) return;
        
        let protectionManager = document.getElementById('shortcut-protection-manager');
        if (!protectionManager) {
            protectionManager = document.createElement('div');
            protectionManager.id = 'shortcut-protection-manager';
            protectionManager.className = 'shortcut-protection-manager';
            
            const managerTitle = document.createElement('h4');
            managerTitle.textContent = 'Protect Specific Shortcuts';
            
            const managerDescription = document.createElement('p');
            managerDescription.className = 'setting-description';
            managerDescription.textContent = 'Select which shortcuts to password protect:';
            
            protectionManager.appendChild(managerTitle);
            protectionManager.appendChild(managerDescription);
            
            passwordSettings.appendChild(protectionManager);
        } else {
            const children = Array.from(protectionManager.children);
            children.forEach((child, index) => {
                if (index > 1) protectionManager.removeChild(child);
            });
        }
        
        const currentShortcuts = Storage.get('shortcuts') || [];
        
        const selectedShortcutsContainer = document.createElement('div');
        selectedShortcutsContainer.className = 'selected-shortcuts-container';
        
        const protectedShortcuts = currentShortcuts.filter(shortcut => shortcut.isPasswordProtected);
        
        if (protectedShortcuts.length > 0) {
            protectedShortcuts.forEach((shortcut, index) => {
                const shortcutChip = document.createElement('div');
                shortcutChip.className = 'shortcut-chip';
                shortcutChip.dataset.index = currentShortcuts.indexOf(shortcut);
                
                const shortcutIcon = document.createElement('img');
                shortcutIcon.src = `https://www.google.com/s2/favicons?domain=${shortcut.url}&sz=64`;
                shortcutIcon.alt = shortcut.name;
                
                const shortcutName = document.createElement('span');
                shortcutName.textContent = shortcut.name;
                
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-chip-btn';
                removeButton.innerHTML = '&times;';
                removeButton.title = 'Remove protection';
                
                shortcutChip.appendChild(shortcutIcon);
                shortcutChip.appendChild(shortcutName);
                shortcutChip.appendChild(removeButton);
                
                removeButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentShortcuts[shortcutChip.dataset.index].isPasswordProtected = false;
                    Storage.set('shortcuts', currentShortcuts);
                    
                    shortcuts.render();
                    shortcuts.createShortcutProtectionManager();
                    
                    notifications.show(`Removed protection from: ${shortcut.name}`, 'info');
                });
                
                selectedShortcutsContainer.appendChild(shortcutChip);
            });
        } else if (currentShortcuts.length > 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-protection-state';
            emptyState.textContent = 'No protected shortcuts yet.';
            selectedShortcutsContainer.appendChild(emptyState);
        }
        
        protectionManager.appendChild(selectedShortcutsContainer);
        
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'shortcut-selector-container';
        
        const unprotectedShortcuts = currentShortcuts.filter(shortcut => !shortcut.isPasswordProtected);
        
        if (unprotectedShortcuts.length > 0) {
            const dropdown = document.createElement('div');
            dropdown.className = 'shortcut-dropdown';
            
            const selected = document.createElement('div');
            selected.className = 'shortcut-dropdown-selected';
            selected.textContent = 'Select a shortcut to protect...';
            
            const dropdownItems = document.createElement('div');
            dropdownItems.className = 'shortcut-dropdown-items';
            dropdownItems.classList.add('hidden');
            
            unprotectedShortcuts.forEach(shortcut => {
                const item = document.createElement('div');
                item.className = 'shortcut-dropdown-item';
                item.dataset.index = currentShortcuts.indexOf(shortcut);
                
                const icon = document.createElement('img');
                icon.src = `https://www.google.com/s2/favicons?domain=${shortcut.url}&sz=64`;
                icon.alt = shortcut.name;
                icon.style.width = '16px';
                icon.style.height = '16px';
                
                const name = document.createElement('span');
                name.textContent = shortcut.name;
                
                item.appendChild(icon);
                item.appendChild(name);
                
                item.addEventListener('click', () => {
                    currentShortcuts[item.dataset.index].isPasswordProtected = true;
                    Storage.set('shortcuts', currentShortcuts);
                    
                    shortcuts.render();
                    shortcuts.createShortcutProtectionManager();
                    
                    dropdownItems.classList.remove('active');
                    selected.classList.remove('active');
                    dropdownItems.classList.add('hidden');
                    
                    notifications.show(`Protected shortcut: ${shortcut.name}`, 'success');
                });
                
                dropdownItems.appendChild(item);
            });
            
            selected.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownItems.classList.toggle('hidden');
                dropdownItems.classList.toggle('active');
                selected.classList.toggle('active');
            });
            
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdownItems.classList.add('hidden');
                    dropdownItems.classList.remove('active');
                    selected.classList.remove('active');
                }
            });
            
            dropdown.appendChild(selected);
            dropdown.appendChild(dropdownItems);
            selectorContainer.appendChild(dropdown);
        } else if (currentShortcuts.length === 0) {
            const noShortcutsMessage = document.createElement('p');
            noShortcutsMessage.className = 'no-shortcuts-message';
            noShortcutsMessage.textContent = 'Add shortcuts to protect them with a password.';
            selectorContainer.appendChild(noShortcutsMessage);
        } else {
            const allProtectedMessage = document.createElement('p');
            allProtectedMessage.className = 'empty-protection-state';
            allProtectedMessage.textContent = 'All shortcuts are password protected.';
            selectorContainer.appendChild(allProtectedMessage);
        }
        
        protectionManager.appendChild(selectorContainer);
    },
    
    updateAddShortcutModal: () => {
        const modal = document.getElementById('add-shortcut-modal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        const existingCheckbox = document.getElementById('protect-shortcut-container');
        if (existingCheckbox) return;
        
        const isPasswordProtectionEnabled = Storage.get('passwordProtectionEnabled') || false;
        if (!isPasswordProtectionEnabled) return;
        
        const checkboxContainer = document.createElement('div');
        checkboxContainer.id = 'protect-shortcut-container';
        checkboxContainer.className = 'checkbox-container';
        checkboxContainer.innerHTML = `
            <label class="checkbox-label">
                <input type="checkbox" id="protect-shortcut">
                <span>Password protect this shortcut</span>
            </label>
        `;
        
        const saveButton = modal.querySelector('#save-shortcut');
        if (saveButton) {
            modalContent.insertBefore(checkboxContainer, saveButton);
        } else {
            modalContent.appendChild(checkboxContainer);
        }
        
        const editModal = document.getElementById('edit-shortcut-modal');
        if (editModal) {
            const existingEditCheckbox = document.getElementById('protect-shortcut-edit-container');
            if (!existingEditCheckbox) {
                const editModalContent = editModal.querySelector('.modal-content');
                const editCheckboxContainer = document.createElement('div');
                editCheckboxContainer.id = 'protect-shortcut-edit-container';
                editCheckboxContainer.className = 'checkbox-container';
                editCheckboxContainer.innerHTML = `
                    <label class="checkbox-label">
                        <input type="checkbox" id="protect-shortcut-edit">
                        <span>Password protect this shortcut</span>
                    </label>
                `;
                
                const modalActions = editModal.querySelector('.modal-actions');
                if (modalActions) {
                    editModalContent.insertBefore(editCheckboxContainer, modalActions);
                } else {
                    editModalContent.appendChild(editCheckboxContainer);
                }
            }
        }
    },
    
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
    }
};