const search = {
    engines: {
        google: {
            url: 'https://www.google.com/search?q=',
            icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32',
            name: 'Google'
        },
        bing: {
            url: 'https://www.bing.com/search?q=',
            icon: 'https://www.google.com/s2/favicons?domain=bing.com&sz=32',
            name: 'Bing'
        },
        duckduckgo: {
            url: 'https://duckduckgo.com/?q=',
            icon: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32',
            name: 'DuckDuckGo'
        },
        brave: {
            url: 'https://search.brave.com/search?q=',
            icon: 'https://www.google.com/s2/favicons?domain=brave.com&sz=32',
            name: 'Brave'
        },
        qwant: {
            url: 'https://www.qwant.com/?q=',
            icon: 'https://www.google.com/s2/favicons?domain=qwant.com&sz=32',
            name: 'Qwant'
        },
        searxng: {
            url: 'https://searx.be/search?q=',
            icon: 'https://www.google.com/s2/favicons?domain=searx.be&sz=32',
            name: 'SearXNG'
        }
    },

    init: () => {
        const searchBar = document.getElementById('search-bar');
        const searchButton = document.getElementById('search-button');
        
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                search.perform();
            }
        });
        
        searchButton.addEventListener('click', search.perform);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && 
                !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && 
                window.getSelection().toString() === '') {
                e.preventDefault();
                searchBar.focus();
            }
        });

        const searchEngine = Storage.get('searchEngine') || 'google';
        search.updateSearchEngineIcon(searchEngine);
    },

    updateSearchEngineIcon(engine) {
        const searchIcon = document.querySelector('#search-container .search-icon img');
        if (!searchIcon) return;
        searchIcon.src = this.engines[engine].icon;
    },

    perform: () => {
        const searchBar = document.getElementById('search-bar');
        const query = searchBar.value.trim();
        const engine = Storage.get('searchEngine') || 'google';
        
        if (query) {
            const searchUrl = search.engines[engine].url + encodeURIComponent(query);
            window.location.href = searchUrl;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    search.init();
});