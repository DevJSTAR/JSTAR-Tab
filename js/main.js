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

    // Fall back to default greeting if custom format is not set or fails
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

// Set up event listeners for modal interactions
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
    });
}

// Open modal with animation
function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

// Close modal with animation
function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Apply visibility settings
    ['greeting', 'search', 'shortcuts', 'addShortcut'].forEach(element => {
        const isVisible = Storage.get(`show_${element}`);
        if (isVisible === false) {
            const elementNode = document.getElementById(element === 'search' ? 'search-container' : element);
            if (elementNode) elementNode.style.display = 'none';
        }
    });

    // Start onboarding or show main content
    if (!Storage.get('onboardingComplete')) {
        onboarding.start();
    } else {
        document.getElementById('main-content').classList.remove('hidden');
    }
    
    // Initialize features
    search.init();
    shortcuts.init();
    settings.init();
    initModalHandlers();
    
    // Set up greeting
    updateGreeting();
    setInterval(updateGreeting, 60000);
    
    // Settings button handler
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    
    settingsButton.addEventListener('click', () => {
        openModal(settingsModal);
    });
});