const search = {
    // Supported search engines and their URLs
    engines: {
        google: 'https://www.google.com/search?q=',
        bing: 'https://www.bing.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        brave: 'https://search.brave.com/search?q=',
        qwant: 'https://www.qwant.com/?q=',
        searxng: 'https://searx.org/search?q='
    },

    // Perform search using selected engine
    perform: () => {
        const searchBar = document.getElementById('search-bar');
        const query = searchBar.value.trim();
        const engine = Storage.get('searchEngine') || 'google';
        
        if (query) {
            const searchUrl = search.engines[engine] + encodeURIComponent(query);
            window.location.href = searchUrl;
        }
    },

    // Initialize search functionality
    init: () => {
        const searchBar = document.getElementById('search-bar');
        const searchButton = document.getElementById('search-button');
        
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                search.perform();
            }
        });
        
        searchButton.addEventListener('click', search.perform);
        
        // Global keyboard shortcut to focus search bar
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && 
                !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && 
                window.getSelection().toString() === '') {
                e.preventDefault();
                searchBar.focus();
            }
        });
    }
};