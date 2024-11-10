// Onboarding module
const onboarding = {
    // Check if onboarding is complete
    isComplete: () => {
        return Storage.get('onboardingComplete') === true;
    },

    // Start the onboarding process
    start: () => {
        const modal = document.getElementById('onboarding-modal');
        const mainContent = document.getElementById('main-content');
        
        if (!onboarding.isComplete()) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            mainContent.classList.add('hidden');
            
            document.getElementById('next-step-btn').addEventListener('click', () => onboarding.nextStep(1));
            document.getElementById('complete-setup-btn').addEventListener('click', onboarding.complete);
            
            // Set up search engine selection
            const engines = document.querySelectorAll('.search-engine-option');
            engines.forEach(engine => {
                engine.addEventListener('click', () => {
                    engines.forEach(e => e.classList.remove('selected'));
                    engine.classList.add('selected');
                });
            });
        } else {
            modal.classList.add('hidden');
            mainContent.classList.remove('hidden');
        }
    },

    // Move to the next step in onboarding
    nextStep: (currentStep) => {
        const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
        const nextStepEl = document.querySelector(`[data-step="${currentStep + 1}"]`);
        const name = document.getElementById('user-name').value.trim();
        
        if (!name) {
            notifications.show('Please enter your name', 'error');
            return;
        }
        
        Storage.set('userName', name);
        
        currentStepEl.classList.add('hidden');
        nextStepEl.classList.remove('hidden');
        nextStepEl.classList.add('visible');
    },

    // Complete the onboarding process
    complete: () => {
        const selectedEngine = document.querySelector('.search-engine-option.selected');
        if (!selectedEngine) {
            notifications.show('Please select a search engine', 'error');
            return;
        }
        
        const searchEngine = selectedEngine.dataset.engine;
        Storage.set('searchEngine', searchEngine);
        Storage.set('onboardingComplete', true);
        
        const modal = document.getElementById('onboarding-modal');
        const mainContent = document.getElementById('main-content');
        
        modal.classList.add('hidden');
        mainContent.classList.remove('hidden');
        notifications.show('Welcome to your new tab! 👋', 'success');
        updateGreeting();
    }
};