document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    updateGreeting();
    loadAnonymizationState(); // Load anonymization state on page load
    loadShortcuts(); // Load shortcuts on page load

    document.getElementById('theme-switch').addEventListener('change', toggleTheme);
    document.getElementById('settings-btn').addEventListener('click', toggleSettings);
    document.getElementById('search-btn').addEventListener('click', searchBrave);
    document.getElementById('search').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchBrave();
        }
    });

    // Add event listener for the anonymize button
    const anonymizeBtn = document.getElementById('anonymize-btn');
    anonymizeBtn.addEventListener('click', toggleAnonymize);

    const modal = document.getElementById('settings-modal');
    modal.addEventListener('click', closeOnClickOutside);
    document.querySelector('.close-btn').addEventListener('click', closeSettings);

    // Add shortcut button listeners
    document.getElementById('add-shortcut').addEventListener('click', addShortcut);
    document.getElementById('import-shortcuts').addEventListener('click', importShortcuts);
    document.getElementById('export-shortcuts').addEventListener('click', exportShortcuts);
    document.getElementById('reset-shortcuts').addEventListener('click', resetShortcuts);

    // Custom context menu for shortcuts
    const contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.innerHTML = `
        <button id="edit-shortcut">Edit</button>
        <button id="delete-shortcut">Delete</button>
    `;
    contextMenu.style.display = 'none';
    document.body.appendChild(contextMenu);

    document.addEventListener('click', (event) => {
        const contextMenu = document.getElementById('context-menu');
        // Hide context menu if the click is outside of it
        if (event.target !== contextMenu && !contextMenu.contains(event.target)) {
            contextMenu.style.display = 'none'; // Hide menu on click outside
        }
    });

    // Close context menu on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            contextMenu.style.display = 'none'; // Hide context menu
        }
    });

    // Detect Shift + A to toggle anonymization, but ensure no other keys are pressed
    document.addEventListener('keydown', (event) => {
        if (event.key === 'A' && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
            toggleAnonymize();
        }
    });

    // Detect Shift + T to toggle theme
    document.addEventListener('keydown', (event) => {
        if (event.key === 'T' && event.shiftKey) {
            toggleThemeShortcut(); // Toggle theme when Shift + T is pressed
        }
    });

    // Detect Shift + S to toggle settings menu
    document.addEventListener('keydown', (event) => {
        if (event.key === 'S' && event.shiftKey) {
            toggleSettings(); // Open or close settings modal
        }
    });
});

let isAnonymized = false; // Track the anonymization state
let currentShortcutIndex = -1; // To keep track of the current shortcut for editing or deleting

function updateGreeting() {
    const greeting = document.getElementById('greeting');
    const date = new Date();
    const hours = date.getUTCHours() + 5; // Adjust for timezone

    let message = `Good ${getTimeOfDay(hours)}, ${isAnonymized ? 'JSTAR' : 'Junaid'}!`;
    greeting.textContent = message;
}

function getTimeOfDay(hours) {
    if (hours >= 5 && hours < 12) {
        return "Morning";
    } else if (hours >= 12 && hours < 17) {
        return "Afternoon";
    } else if (hours >= 17 && hours < 22) {
        return "Evening";
    } else {
        return "Night";
    }
}

function searchBrave() {
    const query = document.getElementById('search').value.trim();
    if (query) {
        window.location.href = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
    }
}

function toggleTheme() {
    const isDark = document.getElementById('theme-switch').checked;
    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const modalContent = document.querySelector('.modal-content');
    modalContent.style.backgroundColor = isDark ? '#1a1a1a' : 'white';
}

// Shortcut to toggle theme
function toggleThemeShortcut() {
    const themeSwitch = document.getElementById('theme-switch');
    themeSwitch.checked = !themeSwitch.checked;
    toggleTheme();
}

function applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    document.getElementById('theme-switch').checked = savedTheme === 'dark';
    document.querySelector('.modal-content').style.backgroundColor = savedTheme === 'dark' ? '#1a1a1a' : 'white';
}

// Load the anonymization state from localStorage
function loadAnonymizationState() {
    const savedAnonymization = localStorage.getItem('anonymization');
    isAnonymized = savedAnonymization === 'true'; // Convert string to boolean

    updateAnonymizeButton();
    updateGreeting();
}

// Load shortcuts from localStorage and display them
function loadShortcuts() {
    const shortcutsContainer = document.getElementById('shortcuts');
    shortcutsContainer.innerHTML = ''; // Clear existing shortcuts

    const savedShortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
    savedShortcuts.forEach((shortcut, index) => {
        const shortcutButton = document.createElement('div');
        shortcutButton.className = 'shortcut';
        
        const favicon = document.createElement('img');
        favicon.src = `https://www.google.com/s2/favicons?domain=${new URL(shortcut.url).hostname}`; // Fetch favicon
        const shortcutName = document.createElement('span');
        shortcutName.textContent = shortcut.name.length > 10 ? shortcut.name.slice(0, 10) + '...' : shortcut.name; // Truncate long names
        
        // Add a click event to open the shortcut link
        shortcutButton.addEventListener('click', (event) => {
            if (event.ctrlKey) {
                window.open(shortcut.url, '_blank'); // Open in a new tab if Ctrl is held
            } else {
                window.location.href = shortcut.url; // Open in the same tab
            }
        });

        // Add context menu for right-click
        shortcutButton.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            showContextMenu(event.clientX, event.clientY, index);
        });

        shortcutButton.appendChild(favicon);
        shortcutButton.appendChild(shortcutName);
        shortcutsContainer.appendChild(shortcutButton);
    });
}

// Show custom context menu
function showContextMenu(x, y, index) {
    currentShortcutIndex = index; // Store the index of the current shortcut
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;

    // Clear previous event handlers (important to prevent multiple listeners)
    const editButton = contextMenu.querySelector('#edit-shortcut');
    const deleteButton = contextMenu.querySelector('#delete-shortcut');

    if (editButton) {
        editButton.onclick = () => {
            editShortcut(); // Trigger edit shortcut
            contextMenu.style.display = 'none'; // Hide context menu
        };
    } else {
        const editBtn = document.createElement('button');
        editBtn.id = 'edit-shortcut';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => {
            editShortcut(); // Trigger edit shortcut
            contextMenu.style.display = 'none'; // Hide context menu
        };
        contextMenu.appendChild(editBtn);
    }

    if (deleteButton) {
        deleteButton.onclick = () => {
            deleteShortcut(); // Trigger delete shortcut
            contextMenu.style.display = 'none'; // Hide context menu
        };
    } else {
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'delete-shortcut';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            deleteShortcut(); // Trigger delete shortcut
            contextMenu.style.display = 'none'; // Hide context menu
        };
        contextMenu.appendChild(deleteBtn);
    }
}

// Toggle anonymization state
function toggleAnonymize() {
    isAnonymized = !isAnonymized; // Toggle the anonymized state
    updateAnonymizeButton();
    updateGreeting();
    
    // Save the current anonymization state to localStorage
    localStorage.setItem('anonymization', isAnonymized);
}

function updateAnonymizeButton() {
    const anonymizeBtn = document.getElementById('anonymize-btn');
    if (isAnonymized) {
        anonymizeBtn.classList.add('active');
        anonymizeBtn.setAttribute('data-tooltip', 'Unanonymize');
        anonymizeBtn.innerHTML = '<i class="fas fa-user"></i>'; // Change icon to un-anonymize
    } else {
        anonymizeBtn.classList.remove('active');
        anonymizeBtn.setAttribute('data-tooltip', 'Anonymize');
        anonymizeBtn.innerHTML = '<i class="fas fa-user-secret"></i>'; // Change icon to anonymize
    }
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.contains('active') ? closeSettings() : openSettings();
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
        modal.querySelector('.modal-content').classList.add('active');
    }, 50);
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    modal.querySelector('.modal-content').classList.remove('active');
    modal.classList.remove('active');

    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function closeOnClickOutside(event) {
    const modal = document.getElementById('settings-modal');
    if (event.target === modal) {
        closeSettings();
    }
}

// Validate if the URL is valid
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Add a new shortcut
function addShortcut() {
    const name = prompt("Enter the shortcut name:");
    const url = prompt("Enter the shortcut URL:");

    if (!name || !url || !isValidURL(url)) {
        alert("Invalid input. Please provide a valid name and URL.");
        return;
    }

    const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
    shortcuts.push({ name, url });
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    loadShortcuts();
}

// Edit the current shortcut
function editShortcut() {
    if (currentShortcutIndex < 0) return;

    const shortcuts = JSON.parse(localStorage.getItem('shortcuts'));
    const currentShortcut = shortcuts[currentShortcutIndex];

    const newName = prompt("Edit the shortcut name:", currentShortcut.name);
    const newUrl = prompt("Edit the shortcut URL:", currentShortcut.url);

    if (!newName || !newUrl || !isValidURL(newUrl)) {
        alert("Invalid input. Please provide a valid name and URL.");
        return;
    }

    shortcuts[currentShortcutIndex] = { name: newName, url: newUrl };
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    loadShortcuts();
}

// Delete the current shortcut
function deleteShortcut() {
    if (currentShortcutIndex < 0) return;

    const shortcuts = JSON.parse(localStorage.getItem('shortcuts'));
    shortcuts.splice(currentShortcutIndex, 1);
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    loadShortcuts();
}

// Import shortcuts from a JSON file
function importShortcuts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const shortcuts = JSON.parse(e.target.result);
                if (Array.isArray(shortcuts)) {
                    localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
                    loadShortcuts();
                } else {
                    alert("Invalid file format. Please upload a valid JSON file.");
                }
            } catch (error) {
                alert("Error parsing JSON. Please ensure the file is valid.");
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// Export shortcuts to a JSON file
function exportShortcuts() {
    const shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || [];
    const dataStr = JSON.stringify(shortcuts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shortcuts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Reset shortcuts to the default state
function resetShortcuts() {
    if (confirm("Are you sure you want to reset the shortcuts? This action cannot be undone.")) {
        localStorage.removeItem('shortcuts');
        loadShortcuts();
    }
}
