// Onboarding module
const onboarding = {
    // Core functions
    isComplete: () => {
        return Storage.get('onboardingComplete') === true;
    },

    start: () => {
        const modal = document.getElementById('onboarding-modal');
        const mainContent = document.getElementById('main-content');
        const importDataBtn = document.getElementById('import-data-btn');
        const startFreshBtn = document.getElementById('start-fresh-btn');
        const fileInput = document.getElementById('onboarding-import');
        
        if (!onboarding.isComplete()) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            mainContent.classList.add('hidden');
            
            startFreshBtn.addEventListener('click', () => {
                document.querySelector('[data-step="1"]').classList.add('hidden');
                document.querySelector('[data-step="2"]').classList.remove('hidden');
                document.getElementById('next-step-btn').addEventListener('click', () => onboarding.nextStep(2));
            });
            
            importDataBtn.addEventListener('click', () => fileInput.click());
            
            // Data import handling
            fileInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    try {
                        const file = e.target.files[0];
                        const text = await file.text();
                        const data = JSON.parse(text);
                        
                        if (!data.settings || typeof data.settings !== 'object' ||
                            !Array.isArray(data.shortcuts)) {
                            throw new Error('Invalid data structure');
                            return;
                        }

                        Object.entries(data.settings).forEach(([key, value]) => {
                            Storage.set(key, value);
                        });

                        Storage.set('shortcuts', data.shortcuts);

                        if (data.keybinds) {
                            Storage.set('keybinds', data.keybinds);
                        }

                        // Initialize components
                        search.init();
                        shortcuts.init();
                        settings.init();
                        updateGreeting();
                        document.body.setAttribute('data-theme', data.settings.theme || 'light');

                        // Update UI visibility
                        ['greeting', 'search', 'shortcuts', 'addShortcut'].forEach(element => {
                            const isVisible = data.settings[`show_${element}`];
                            const elementNode = document.getElementById(element === 'search' ? 'search-container' : element);
                            if (elementNode) {
                                elementNode.style.display = isVisible === false ? 'none' : 'block';
                            }
                        });

                        Storage.set('onboardingComplete', true);
                        modal.classList.add('hidden');
                        mainContent.classList.remove('hidden');
                        
                        const userName = Storage.get('userName') || 'Guest';
                        notifications.show(`Welcome back, ${userName}! 👋`, 'success');
                    } catch (error) {
                        notifications.show('Failed to import data: Invalid file format!', 'error');
                        fileInput.value = '';
                    }
                }
            });

            // Search engine selection
            const engines = document.querySelectorAll('.search-engine-option');
            engines.forEach(engine => {
                engine.addEventListener('click', () => {
                    engines.forEach(e => e.classList.remove('selected'));
                    engine.classList.add('selected');
                });
            });

            document.getElementById('complete-setup-btn').addEventListener('click', onboarding.complete);
        } else {
            modal.classList.add('hidden');
            mainContent.classList.remove('hidden');
        }
    },

    // Onboarding step navigation
    nextStep: (currentStep) => {
        const currentStepEl = document.querySelector(`[data-step="${currentStep}"]`);
        const nextStepEl = document.querySelector(`[data-step="${currentStep + 1}"]`);
        
        if (currentStep === 2) {
            const name = document.getElementById('user-name').value.trim();
            if (!name) {
                notifications.show('Please enter your name!', 'error');
                return;
            }
            Storage.set('userName', name);
        }
        
        currentStepEl.classList.add('hidden');
        nextStepEl.classList.remove('hidden');
        nextStepEl.classList.add('visible');
    },

    // Finalize onboarding
    complete: () => {
        const selectedEngine = document.querySelector('.search-engine-option.selected');
        if (!selectedEngine) {
            notifications.show('Please select a search engine!', 'error');
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