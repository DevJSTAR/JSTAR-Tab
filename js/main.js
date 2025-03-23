if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

async function updateGreeting() {
    const greeting = document.getElementById('greeting');
    if (!greeting) return;

    const customFormat = Storage.get('customGreeting');
    if (customFormat) {
        const formattedGreeting = await settings.formatGreeting(customFormat);
        if (formattedGreeting) {
            greeting.textContent = formattedGreeting;
            greeting.style.opacity = '0';
            setTimeout(() => {
                greeting.style.opacity = '1';
            }, 100);
            return;
        }
    }

    const hour = new Date().getHours();
    const isAnonymous = Storage.get('anonymousMode') || false;
    const userName = isAnonymous ? 
        (Storage.get('anonymousName') || anonymousNames.generate()) : 
        (Storage.get('userName') || 'Friend');
    
    let timeGreeting = 'Hello';
    if (hour >= 5 && hour < 12) timeGreeting = 'Good Morning';
    else if (hour >= 12 && hour < 17) timeGreeting = 'Good Afternoon';
    else if (hour >= 17 && hour < 20) timeGreeting = 'Good Evening';
    else timeGreeting = 'Good Night';
    
    greeting.textContent = `${timeGreeting}, ${userName}!`;
    greeting.style.opacity = '0';
    setTimeout(() => {
        greeting.style.opacity = '1';
    }, 100);
}

function initModalHandlers() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && !modal.classList.contains('onboarding-modal')) {
                closeModal(modal);
            }
        });

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        document.querySelectorAll('.modal .close-button').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    closeModal(modal);
                }
            });
        });
    });
}

function openModal(modal) {
    if (!modal) return;

    const contextMenu = document.querySelector('.context-menu');
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof settings !== 'undefined' && typeof settings.updateVisibility === 'function') {
        settings.updateVisibility();
    } else {
        ['greeting', 'search', 'shortcuts', 'addShortcut'].forEach(element => {
            const isVisible = Storage.get(`show_${element}`);
            if (isVisible === false) {
                const elementNode = document.getElementById(element === 'search' ? 'search-container' : 
                    element === 'addShortcut' ? 'add-shortcut' : element);
                
                if (elementNode) {
                    elementNode.style.visibility = 'hidden';
                    elementNode.style.opacity = '0';
                    elementNode.style.position = 'absolute';
                    elementNode.style.pointerEvents = 'none';
                }
            }
        });
    }

    if (!Storage.get('onboardingComplete')) {
        onboarding.start();
    } else {
        document.getElementById('main-content').classList.remove('hidden');
    }
    
    search.init();
    shortcuts.init();
    settings.init();
    initModalHandlers();
    
    updateGreeting();
    setInterval(updateGreeting, 60000);
    
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    
    settingsButton.addEventListener('click', () => {
        openModal(settingsModal);
    });

    keybinds.init();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal && !activeModal.matches('#settings-modal')) {
            const primaryButton = activeModal.querySelector('.btn-primary');
            if (primaryButton) {
                primaryButton.click();
            }
        }
    }
});
