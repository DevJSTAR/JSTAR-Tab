document.addEventListener('DOMContentLoaded', () => {
    const MAX_IMAGE_SIZE_MB = 5;
    const MAX_USER_BACKGROUNDS = 10;

    const backgroundUpload = document.getElementById('background-upload');
    const backgroundPreviewGrid = document.getElementById('background-preview-grid');
    const resetBackground = document.getElementById('default-background');

    resetBackground.style.order = '-1';
    backgroundPreviewGrid.prepend(resetBackground);

    loadBackgrounds();
    setSavedBackground();

    backgroundUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            notifications.show(`Image exceeds size limit (max ${MAX_IMAGE_SIZE_MB} MB)`, 'error');
            event.target.value = '';
            return;
        }

        const existingBackgrounds = JSON.parse(Storage.get('backgrounds') || '[]');
        if (existingBackgrounds.length >= MAX_USER_BACKGROUNDS) {
            notifications.show(`Maximum custom backgrounds limit reached!`, 'error');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const imageUrl = e.target.result;
            addBackgroundPreview(imageUrl, false);
            saveBackground(imageUrl);
            setCustomBackground(imageUrl);
            notifications.show('Background uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    });

    resetBackground.addEventListener('click', () => {
        const currentBackground = Storage.get('customBackground');
        if (!currentBackground) return;
        
        document.body.style.backgroundImage = '';
        Storage.remove('customBackground');
        removeAllSelection();
        notifications.show('Background reset to default!', 'success');
    });

    function loadBackgrounds() {
        try {
            const backgrounds = JSON.parse(Storage.get('backgrounds') || '[]');
            if (!Array.isArray(backgrounds)) {
                throw new Error('Invalid backgrounds format');
            }
            backgrounds.forEach((bg) => {
                if (typeof bg === 'string' && 
                    (bg.startsWith('data:image/') || bg.startsWith('images/backgrounds/'))) {
                    addBackgroundPreview(bg, false);
                }
            });
        } catch (e) {
            console.error('Failed to load backgrounds:', e);
            Storage.set('backgrounds', '[]');
            notifications.show('Corrupted backgrounds data - resetting', 'error');
        }
    }

    function setSavedBackground() {
        const customBackground = Storage.get('customBackground');
        if (customBackground) {
            setCustomBackground(customBackground, true);
        }
    }

    function addBackgroundPreview(imageUrl, isPredefined) {
        const preview = document.createElement('div');
        preview.className = 'background-preview' + (isPredefined ? ' predefined' : ' custom');
        preview.style.backgroundImage = `url(${imageUrl})`;
        preview.dataset.url = imageUrl;
        
        if (Storage.get('customBackground') === imageUrl) {
            preview.classList.add('selected');
        }

        preview.addEventListener('click', () => {
            if (Storage.get('customBackground') === imageUrl) return;
            setCustomBackground(imageUrl);
            removeAllSelection();
            preview.classList.add('selected');
        });

        if (!isPredefined) {
            const removeIcon = document.createElement('span');
            removeIcon.className = 'remove-icon';
            removeIcon.innerHTML = '<i class="fas fa-times"></i>';
            removeIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasSelected = preview.classList.contains('selected');
                
                if (wasSelected) {
                    document.body.style.backgroundImage = '';
                    Storage.remove('customBackground');
                }
                
                removeBackground(imageUrl);
                preview.remove();
                notifications.show('Background removed!', 'success');
            });
            preview.appendChild(removeIcon);
        }

        const insertPosition = isPredefined ? 1 : backgroundPreviewGrid.children.length;
        backgroundPreviewGrid.insertBefore(preview, backgroundPreviewGrid.children[insertPosition]);
    }

    function removeAllSelection() {
        document.querySelectorAll('.background-preview').forEach(preview => {
            preview.classList.remove('selected');
        });
    }

    function removeBackground(imageUrl) {
        const backgrounds = JSON.parse(Storage.get('backgrounds') || '[]');
        Storage.set('backgrounds', JSON.stringify(backgrounds.filter(bg => bg !== imageUrl)));
    }

    function saveBackground(imageUrl) {
        const backgrounds = JSON.parse(Storage.get('backgrounds') || '[]');
        if (!backgrounds.includes(imageUrl)) {
            backgrounds.push(imageUrl);
            Storage.set('backgrounds', JSON.stringify(backgrounds));
        }
    }

    function setCustomBackground(imageUrl, initialLoad = false) {
        document.body.style.backgroundImage = `url(${imageUrl})`;
        Storage.set('customBackground', imageUrl);
        
        if (!initialLoad) {
            removeAllSelection();
            const targetPreview = document.querySelector(`.background-preview[data-url="${imageUrl}"]`);
            if (targetPreview) targetPreview.classList.add('selected');
        }
    }

    const predefinedImages = [
        'images/backgrounds/cherry.png',
        'images/backgrounds/mommies.png',
        'images/backgrounds/peachs-castle.png',
        'images/backgrounds/windows-xp.jpg',
    ];

    predefinedImages.forEach(image => addBackgroundPreview(image, true));
});