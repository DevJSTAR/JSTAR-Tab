document.addEventListener('DOMContentLoaded', () => {
    const historyContainer = document.querySelector('.history-container');
    const searchInput = document.querySelector('.search-bar input');
    const searchClear = document.querySelector('.search-clear');
    const selectAllCheckbox = document.querySelector('#select-all');
    const deleteSelectedBtn = document.querySelector('#delete-selected');
    const clearAllBtn = document.querySelector('#clear-all');
    const historyContent = document.querySelector('.history-content');
    const historyItems = document.querySelector('.history-items');
    const historyLoading = document.querySelector('.history-loading');
    const historyEmpty = document.querySelector('.history-empty');
    const loadMoreBtn = document.querySelector('.history-load-more button');
    const confirmationDialog = document.querySelector('#confirmation-dialog');
    const confirmTitle = document.querySelector('#confirmation-title');
    const confirmMessage = document.querySelector('#confirmation-message');
    const confirmYesBtn = document.querySelector('#confirm-yes');
    const confirmNoBtn = document.querySelector('#confirm-no');
    const searchResultsCount = document.querySelector('.search-results-count');
    
    const browserInfo = detectBrowser();
    console.log(`Detected browser: ${browserInfo.name} ${browserInfo.version}`);
    
    const faviconCache = new Map();
    
    let state = {
        history: [],
        filteredHistory: [],
        searchTerm: '',
        selectedItems: new Set(),
        isLoading: true,
        page: 1,
        hasMore: true,
        itemsPerPage: 100,
        currentAction: null
    };
    
    initEvents();
    loadHistory();
    
    function initEvents() {
        if (searchInput) searchInput.addEventListener('input', debounce(handleSearch, 300));
        if (searchClear) {
            searchClear.addEventListener('click', clearSearch);
            hideElement(searchClear);
        }
        
        if (selectAllCheckbox) selectAllCheckbox.addEventListener('change', handleSelectAll);
        
        if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', () => {
            if (state.selectedItems.size === 0) {
                showNotification('No items selected', 'error');
                return;
            }
            state.currentAction = 'delete-selected';
            confirmTitle.textContent = 'Delete selected items?';
            confirmMessage.textContent = 'This will remove the selected browsing history items.';
            showConfirmationDialog();
        });
        
        if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
            if (state.filteredHistory.length === 0) {
                showNotification('No history to clear', 'error');
                return;
            }
            state.currentAction = 'clear-all';
            confirmTitle.textContent = 'Clear all history?';
            confirmMessage.textContent = 'This will remove all your browsing history.';
            showConfirmationDialog();
        });
        
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMoreHistory);
        
        if (confirmYesBtn) confirmYesBtn.addEventListener('click', handleConfirmedDelete);
        if (confirmNoBtn) confirmNoBtn.addEventListener('click', hideConfirmationDialog);
        
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', hideConfirmationDialog);
        }
        
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                window.history.back();
            });
        }
    }
    
    function detectBrowser() {
        const userAgent = navigator.userAgent;
        let browserName = "Unknown";
        let version = "";
        
        if (userAgent.indexOf("Firefox") > -1) {
            browserName = "Firefox";
            version = userAgent.match(/Firefox\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf("Edg") > -1) {
            browserName = "Edge";
            version = userAgent.match(/Edg\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf("Chrome") > -1) {
            browserName = "Chrome";
            version = userAgent.match(/Chrome\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf("Safari") > -1) {
            browserName = "Safari";
            version = userAgent.match(/Safari\/([0-9.]+)/)[1];
        } else if (userAgent.indexOf("OPR") > -1 || userAgent.indexOf("Opera") > -1) {
            browserName = "Opera";
            version = userAgent.match(/(?:OPR|Opera)\/([0-9.]+)/)[1];
        }
        
        return { name: browserName, version: version };
    }
    
    function extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return url;
        }
    }
    
    async function loadHistory() {
        showLoading();
        
        try {
            state.page = 1;
            state.hasMore = true;
            
            if (typeof chrome !== 'undefined' && chrome.history) {
                console.log('Using Chrome history API');
                const historyData = await fetchChromeHistory();
                state.history = historyData;
                state.filteredHistory = historyData;
                
                if (historyData.length >= state.itemsPerPage) {
                    state.hasMore = true;
                } else {
                    state.hasMore = false;
                }
            } else if (typeof browser !== 'undefined' && browser.history) {
                console.log('Using Firefox history API');
                const historyData = await fetchFirefoxHistory();
                state.history = historyData;
                state.filteredHistory = historyData;
                
                if (historyData.length >= state.itemsPerPage) {
                    state.hasMore = true;
                } else {
                    state.hasMore = false;
                }
            } else {
                console.warn('No browser history API available');
                state.history = [];
                state.filteredHistory = [];
                showNotification('Cannot access browser history. Make sure permissions are granted.', 'error');
            }
            
            state.isLoading = false;
            
            updateUI();
            
            if (state.filteredHistory.length === 0) {
                if (state.searchTerm) {
                    showEmptyState('No history found', 'No results match your search. Try different keywords.');
                } else {
                    showEmptyState('No history found', 'Your browsing history will appear here.');
                }
            }
        } catch (error) {
            console.error('Error loading history:', error);
            hideLoading();
            showEmptyState('Error loading history', 'There was a problem accessing your browsing history. Make sure the extension has the necessary permissions.');
        }
    }
    
    async function fetchChromeHistory() {
        return new Promise((resolve, reject) => {
            const searchParams = getHistorySearchParams();
            
            chrome.history.search(searchParams, (historyItems) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                
                const formattedItems = historyItems.map(item => ({
                    id: item.id,
                    url: item.url,
                    title: item.title || extractDomain(item.url),
                    lastVisitTime: item.lastVisitTime,
                    visitCount: item.visitCount,
                    domain: extractDomain(item.url)
                }));
                
                resolve(formattedItems);
            });
        });
    }
    
    async function fetchFirefoxHistory() {
        return new Promise((resolve, reject) => {
            const searchParams = getHistorySearchParams();
            
            browser.history.search(searchParams).then(historyItems => {
                const formattedItems = historyItems.map(item => ({
                    id: item.id,
                    url: item.url,
                    title: item.title || extractDomain(item.url),
                    lastVisitTime: item.lastVisitTime,
                    visitCount: item.visitCount,
                    domain: extractDomain(item.url)
                }));
                
                resolve(formattedItems);
            }).catch(error => {
                reject(error);
            });
        });
    }
    
    function getHistorySearchParams() {
        return {
            text: state.searchTerm,
            maxResults: state.itemsPerPage * 3,
            startTime: 0
        };
    }
    
    async function loadMoreHistory() {
        if (!state.hasMore) {
            hideElement(document.querySelector('.history-load-more'));
            return;
        }
        
        state.page++;
        
        if (typeof chrome !== 'undefined' && chrome.history) {
        try {
                const lastItem = state.filteredHistory[state.filteredHistory.length - 1];
                const startTime = lastItem ? lastItem.lastVisitTime - 1 : 0;
            
                const searchParams = {
                    text: state.searchTerm,
                    maxResults: state.itemsPerPage * 2,
                    startTime: 0,
                    endTime: startTime
                };
                
                chrome.history.search(searchParams, (historyItems) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error loading more history:', chrome.runtime.lastError);
                        return;
                    }
                    
                    const existingIds = new Set(state.filteredHistory.map(item => item.id));
                    const newItems = historyItems
                        .filter(item => !existingIds.has(item.id))
                        .map(item => ({
                            id: item.id,
                            url: item.url,
                            title: item.title || extractDomain(item.url),
                            lastVisitTime: item.lastVisitTime,
                            visitCount: item.visitCount,
                            domain: extractDomain(item.url)
                        }));
                    
                    if (newItems.length === 0) {
                        state.hasMore = false;
                        hideElement(document.querySelector('.history-load-more'));
                            return;
                        }
                    
                    state.history = [...state.history, ...newItems];
                    state.filteredHistory = [...state.filteredHistory, ...newItems];
                    
                    renderMoreHistoryItems(newItems);
                    
                    if (newItems.length < state.itemsPerPage) {
                        state.hasMore = false;
                        hideElement(document.querySelector('.history-load-more'));
                    }
                });
            } catch (error) {
                console.error('Error loading more history:', error);
                state.hasMore = false;
                hideElement(document.querySelector('.history-load-more'));
            }
        } else if (typeof browser !== 'undefined' && browser.history) {
            try {
                const lastItem = state.filteredHistory[state.filteredHistory.length - 1];
                const startTime = lastItem ? lastItem.lastVisitTime - 1 : 0;
                
                const searchParams = {
                    text: state.searchTerm,
                    maxResults: state.itemsPerPage * 2,
                    startTime: 0,
                    endTime: startTime
                };
                
                const historyItems = await browser.history.search(searchParams);
                
                const existingIds = new Set(state.filteredHistory.map(item => item.id));
                const newItems = historyItems
                    .filter(item => !existingIds.has(item.id))
                    .map(item => ({
                id: item.id,
                url: item.url,
                title: item.title || extractDomain(item.url),
                lastVisitTime: item.lastVisitTime,
                visitCount: item.visitCount,
                domain: extractDomain(item.url)
            }));
            
                if (newItems.length === 0) {
                state.hasMore = false;
                    hideElement(document.querySelector('.history-load-more'));
                    return;
            }
            
            state.history = [...state.history, ...newItems];
                state.filteredHistory = [...state.filteredHistory, ...newItems];
                
                renderMoreHistoryItems(newItems);
                
                if (newItems.length < state.itemsPerPage) {
                    state.hasMore = false;
                    hideElement(document.querySelector('.history-load-more'));
                }
        } catch (error) {
            console.error('Error loading more history:', error);
            state.hasMore = false;
                hideElement(document.querySelector('.history-load-more'));
            }
        }
    }
    
    function renderMoreHistoryItems(items) {
        if (items.length === 0) return;
        
        const groupedItems = groupByDate(items);
        const historyItemsContainer = document.querySelector('.history-items');
        
        for (const [date, dateItems] of Object.entries(groupedItems)) {
            let dateGroup = document.querySelector(`.history-date-group[data-date="${date}"]`);
            
            if (!dateGroup) {
                dateGroup = document.createElement('div');
                dateGroup.className = 'history-date-group';
                dateGroup.setAttribute('data-date', date);
                
                const dateHeader = document.createElement('div');
                dateHeader.className = 'history-date-header';
                dateHeader.textContent = formatDateHeading(date);
                
                dateGroup.appendChild(dateHeader);
                historyItemsContainer.appendChild(dateGroup);
            }
            
            for (const item of dateItems) {
                const itemElement = createHistoryItemElement(item);
                dateGroup.appendChild(itemElement);
            }
        }
    }
    
    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        state.searchTerm = searchTerm;
        
        if (searchTerm.length > 0) {
            showElement(searchClear);
        } else {
            hideElement(searchClear);
    }
    
        state.page = 1;
        state.hasMore = true;
        
        loadHistory();
    }
    
    function clearSearch() {
        if (searchInput) {
            searchInput.value = '';
            state.searchTerm = '';
            hideElement(searchClear);
            
            state.page = 1;
            state.hasMore = true;
            
            loadHistory();
        }
    }
    
    function applySearch() {
        if (state.searchTerm.length > 0) {
            const filtered = state.history.filter(item => {
                const title = (item.title || '').toLowerCase();
                const url = (item.url || '').toLowerCase();
                const domain = (item.domain || '').toLowerCase();
                
                return title.includes(state.searchTerm) || 
                       url.includes(state.searchTerm) || 
                       domain.includes(state.searchTerm);
            });
        
        state.filteredHistory = filtered;
        } else {
            state.filteredHistory = state.history;
        }
        
        updateUI();
    }
    
    function updateUI() {
        hideLoading();
        
        if (state.filteredHistory.length === 0) {
            showEmptyState('No history found', 'No results match your search. Try different keywords.');
        } else {
            hideEmptyState();
        }
        
            renderHistoryItems(state.filteredHistory);
            
        updateActionButtonsState();
        
            if (state.hasMore) {
            showElement(document.querySelector('.history-load-more'));
            } else {
            hideElement(document.querySelector('.history-load-more'));
        }
        
        if (searchResultsCount) {
            if (state.searchTerm) {
                searchResultsCount.textContent = `${state.filteredHistory.length} results found for "${state.searchTerm}"`;
                showElement(searchResultsCount);
            } else {
                hideElement(searchResultsCount);
            }
        }
    }
    
    function renderHistoryItems(items) {
        if (!historyItems) return;
        
        historyItems.innerHTML = '';
        
        if (items.length === 0) {
            showEmptyState();
            return;
        }
        
        const groupedItems = groupByDate(items);
        
        for (const [date, dateItems] of Object.entries(groupedItems)) {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'history-date-group';
            dateGroup.setAttribute('data-date', date);
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'history-date-header';
            dateHeader.textContent = formatDateHeading(date);
            
            dateGroup.appendChild(dateHeader);
            
            for (const item of dateItems) {
                const itemElement = createHistoryItemElement(item);
                dateGroup.appendChild(itemElement);
            }
            
            historyItems.appendChild(dateGroup);
        }
    }
    
    function createHistoryItemElement(item) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.setAttribute('data-id', item.id);
        
        const checkbox = document.createElement('div');
        checkbox.className = 'history-item-checkbox';
        const checkboxInput = document.createElement('input');
        checkboxInput.type = 'checkbox';
        checkboxInput.checked = state.selectedItems.has(item.id);
        checkboxInput.addEventListener('change', (e) => {
            handleItemSelection(item.id, e.target.checked);
        });
        checkbox.appendChild(checkboxInput);
        
        const favicon = document.createElement('div');
        favicon.className = 'history-item-favicon';
        
        let faviconUrl = faviconCache.get(item.domain);
        if (!faviconUrl) {
            faviconUrl = `https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`;
            faviconCache.set(item.domain, faviconUrl);
        }
        
        const faviconImg = document.createElement('img');
        faviconImg.src = faviconUrl;
        faviconImg.alt = '';
        faviconImg.onerror = () => {
            favicon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="globe-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            `;
        };
        
        favicon.appendChild(faviconImg);
        
        const content = document.createElement('div');
        content.className = 'history-item-content';
        
        const title = document.createElement('div');
        title.className = 'history-item-title';
        title.textContent = item.title || extractDomain(item.url);
        
        const url = document.createElement('div');
        url.className = 'history-item-url';
        url.textContent = item.url;
        
        content.appendChild(title);
        content.appendChild(url);
        
        const time = document.createElement('div');
        time.className = 'history-item-time';
        time.textContent = formatTime(new Date(item.lastVisitTime));
        
        const actions = document.createElement('div');
        actions.className = 'history-item-actions';
        
        const openAction = document.createElement('button');
        openAction.className = 'history-item-action';
        openAction.title = 'Open in new tab';
        openAction.innerHTML = '<svg><use xlink:href="#icon-external-link"></use></svg>';
        openAction.addEventListener('click', (e) => {
            e.stopPropagation();
            openLink(item.url);
        });
        
        const deleteAction = document.createElement('button');
        deleteAction.className = 'history-item-action delete';
        deleteAction.title = 'Delete';
        deleteAction.innerHTML = '<svg><use xlink:href="#icon-trash"></use></svg>';
        deleteAction.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHistoryItem(item.id);
        });
        
        actions.appendChild(openAction);
        actions.appendChild(deleteAction);
        
        content.addEventListener('click', () => {
            const isSelected = state.selectedItems.has(item.id);
            checkboxInput.checked = !isSelected;
            handleItemSelection(item.id, !isSelected);
        });
        
        historyItem.appendChild(checkbox);
        historyItem.appendChild(favicon);
        historyItem.appendChild(content);
        historyItem.appendChild(time);
        historyItem.appendChild(actions);
        
        return historyItem;
    }
    
    function handleSelectAll(e) {
        const isChecked = e.target.checked;
        
        if (isChecked) {
            state.filteredHistory.forEach(item => {
                state.selectedItems.add(item.id);
            });
        } else {
            state.selectedItems.clear();
        }
        
        const checkboxes = document.querySelectorAll('.history-item-checkbox input');
        checkboxes.forEach(checkbox => {
            const itemId = checkbox.closest('.history-item').getAttribute('data-id');
            checkbox.checked = state.selectedItems.has(itemId);
        });
        
        updateActionButtonsState();
    }
    
    function handleItemSelection(id, isSelected) {
        if (isSelected) {
            state.selectedItems.add(id);
        } else {
            state.selectedItems.delete(id);
        }
        
        updateActionButtonsState();
    }
    
    function updateActionButtonsState() {
        if (deleteSelectedBtn) {
            deleteSelectedBtn.disabled = state.selectedItems.size === 0;
        }
        
        if (clearAllBtn) {
            clearAllBtn.disabled = state.filteredHistory.length === 0;
        }
        
        const selectAllCheckbox = document.querySelector('#select-all');
        if (selectAllCheckbox) {
            if (state.filteredHistory.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.disabled = true;
            } else {
                selectAllCheckbox.disabled = false;
                selectAllCheckbox.checked = state.filteredHistory.length > 0 && 
                    state.selectedItems.size === state.filteredHistory.length;
            }
        }
    }
    
    function deleteHistoryItem(id) {
        state.currentAction = 'delete-item';
        state.currentItemId = id;
        confirmTitle.textContent = 'Delete item?';
        confirmMessage.textContent = 'This will remove this item from your browsing history.';
        showConfirmationDialog();
    }
    
    function removeHistoryItemFromState(id) {
        state.selectedItems.delete(id);
        
        state.history = state.history.filter(item => item.id !== id);
        state.filteredHistory = state.filteredHistory.filter(item => item.id !== id);
        
        const itemElement = document.querySelector(`.history-item[data-id="${id}"]`);
        if (itemElement) {
            const dateGroup = itemElement.closest('.history-date-group');
            itemElement.remove();
            
            if (dateGroup && dateGroup.querySelectorAll('.history-item').length === 0) {
                dateGroup.remove();
            }
        }
        
        updateActionButtonsState();
        
                if (state.filteredHistory.length === 0) {
            if (state.searchTerm) {
                showEmptyState('No history found', 'No results match your search. Try different keywords.');
            } else {
                    showEmptyState('No history found', 'Your browsing history will appear here.');
                }
        }
    }
    
    function handleConfirmedDelete() {
        hideConfirmationDialog();
        
        if (state.currentAction === 'delete-selected') {
            deleteSelectedItems();
        } else if (state.currentAction === 'clear-all') {
            clearAllHistory();
        } else if (state.currentAction === 'delete-item') {
            const id = state.currentItemId;
            if (typeof chrome !== 'undefined' && chrome.history) {
                chrome.history.deleteUrl({ url: state.history.find(item => item.id === id).url }, () => {
                    removeHistoryItemFromState(id);
                    showNotification('Item deleted', 'success');
                });
            } else if (typeof browser !== 'undefined' && browser.history) {
                browser.history.deleteUrl({ url: state.history.find(item => item.id === id).url }).then(() => {
                    removeHistoryItemFromState(id);
                    showNotification('Item deleted', 'success');
                });
            } else {
                removeHistoryItemFromState(id);
                showNotification('Item deleted', 'success');
            }
        }
        
        state.currentAction = null;
        state.currentItemId = null;
    }
    
    function deleteSelectedItems() {
        const selectedIds = Array.from(state.selectedItems);
        
        if (selectedIds.length === 0) {
            showNotification('No items selected', 'error');
            return;
        }
        
        const selectedUrls = state.history
            .filter(item => state.selectedItems.has(item.id))
            .map(item => item.url);
        
        if (typeof chrome !== 'undefined' && chrome.history) {
            let deletedCount = 0;
            
            selectedUrls.forEach(url => {
                chrome.history.deleteUrl({ url }, () => {
                    deletedCount++;
                    if (deletedCount === selectedUrls.length) {
                        selectedIds.forEach(id => removeHistoryItemFromState(id));
                state.selectedItems.clear();
                        updateActionButtonsState();
                
                        showNotification(`${selectedUrls.length} items deleted`, 'success');
                    }
                });
            });
        } else if (typeof browser !== 'undefined' && browser.history) {
            Promise.all(selectedUrls.map(url => browser.history.deleteUrl({ url })))
                .then(() => {
                    selectedIds.forEach(id => removeHistoryItemFromState(id));
                state.selectedItems.clear();
                    updateActionButtonsState();
                    
                    showNotification(`${selectedUrls.length} items deleted`, 'success');
                })
                .catch(error => {
                    console.error('Error deleting history items:', error);
                    showNotification('Error deleting items', 'error');
            });
        } else {
            selectedIds.forEach(id => removeHistoryItemFromState(id));
            state.selectedItems.clear();
            updateActionButtonsState();
            
            showNotification(`${selectedUrls.length} items deleted`, 'success');
        }
    }
    
    function clearAllHistory() {
        if (state.filteredHistory.length === 0) {
            showNotification('No history to clear', 'error');
                    return;
                }
                
        if (typeof chrome !== 'undefined' && chrome.history) {
            chrome.history.deleteAll(() => {
                state.history = [];
                state.filteredHistory = [];
                state.selectedItems.clear();
                
                historyItems.innerHTML = '';
                updateActionButtonsState();
                showEmptyState('History cleared', 'Your browsing history has been cleared.');
                
                showNotification('History cleared', 'success');
            });
        } else if (typeof browser !== 'undefined' && browser.history) {
            browser.history.deleteAll().then(() => {
                    state.history = [];
                    state.filteredHistory = [];
                    state.selectedItems.clear();
                    
                historyItems.innerHTML = '';
                updateActionButtonsState();
                showEmptyState('History cleared', 'Your browsing history has been cleared.');
                
                showNotification('History cleared', 'success');
                });
        } else {
            state.history = [];
            state.filteredHistory = [];
            state.selectedItems.clear();
            
            historyItems.innerHTML = '';
            updateActionButtonsState();
            showEmptyState('History cleared', 'Your browsing history has been cleared.');
            
            showNotification('History cleared', 'success');
        }
    }
    
    function showLoading() {
        if (historyLoading) {
            showElement(historyLoading);
        }
        
        hideEmptyState();
        if (historyItems) {
            historyItems.innerHTML = '';
        }
    }
    
    function hideLoading() {
        if (historyLoading) {
            hideElement(historyLoading);
        }
    }
    
    function showEmptyState(title = 'No history found', message = 'There are no items in your browsing history that match your search.') {
        if (!historyEmpty) return;
        
        const titleElement = historyEmpty.querySelector('h2');
        const messageElement = historyEmpty.querySelector('p');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        
        showElement(historyEmpty);
    }
    
    function hideEmptyState() {
        if (historyEmpty) {
            hideElement(historyEmpty);
        }
    }
    
    function showElement(element) {
        if (element) element.classList.remove('hidden');
    }
    
    function hideElement(element) {
        if (element) element.classList.add('hidden');
    }
    
    function showConfirmationDialog() {
        if (confirmationDialog) {
            showElement(confirmationDialog);
        }
    }
    
    function hideConfirmationDialog() {
        if (confirmationDialog) {
            hideElement(confirmationDialog);
        }
    }
    
    function showNotification(message, type = 'success') {
        if (window.notifications && typeof window.notifications.show === 'function') {
            window.notifications.show(message, type);
        } else {
            console.log(`Notification: ${message} (${type})`);
        }
    }
    
    function openLink(url) {
        window.open(url, '_blank');
    }
    
    function formatDateHeading(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
    
    function formatTime(date) {
        return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    
    function groupByDate(items) {
        const grouped = {};
        
        items.forEach(item => {
            const date = new Date(item.lastVisitTime);
            const dateKey = date.toDateString();
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            
            grouped[dateKey].push(item);
        });
        
        for (const date in grouped) {
            grouped[date].sort((a, b) => b.lastVisitTime - a.lastVisitTime);
        }
        
        return grouped;
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}); 