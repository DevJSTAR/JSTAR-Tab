const CacheUpdater = {
    update: () => {
      const shortcuts = Storage.get('shortcuts') || [];
      const faviconUrls = shortcuts.map(shortcut => 
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(shortcut.url).hostname)}&sz=64`
      );
  
      if (navigator.serviceWorker?.controller && faviconUrls.length > 0) {
        navigator.serviceWorker.controller.postMessage({
          action: 'updateFavicons',
          urls: faviconUrls
        });
      }
    }
  };
  
  const cacheHandler = {
      SHORTCUT_CACHE_DURATION: 7 * 24 * 60 * 60 * 1000,
      
      init() {
          this.cleanExpiredCache();
      },
  
      cleanExpiredCache() {
          const cache = this.getAllCache();
          const now = Date.now();
          
          Object.entries(cache).forEach(([key, value]) => {
              if (key.startsWith('shortcut_') && value.expiry && value.expiry < now) {
                  this.removeFromCache(key);
              }
          });
      },
  
      addToCache(key, value, isSearchEngine = false) {
          const cacheItem = {
              value,
              timestamp: Date.now(),
              expiry: isSearchEngine ? null : Date.now() + this.SHORTCUT_CACHE_DURATION
          };
          
          localStorage.setItem(key, JSON.stringify(cacheItem));
      },
  
      getFromCache(key) {
          const item = localStorage.getItem(key);
          if (!item) return null;
          
          try {
              const cacheItem = JSON.parse(item);
              
              if (cacheItem.expiry && cacheItem.expiry < Date.now()) {
                  this.removeFromCache(key);
                  return null;
              }
              
              return cacheItem.value;
          } catch (error) {
              console.error('Cache read error:', error);
              return null;
          }
      },
  
      removeFromCache(key) {
          localStorage.removeItem(key);
      },
  
      getAllCache() {
          const cache = {};
          for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key.startsWith('shortcut_') || key.startsWith('search_engine_')) {
                  try {
                      cache[key] = JSON.parse(localStorage.getItem(key));
                  } catch (error) {
                      console.error('Cache read error:', error);
                  }
              }
          }
          return cache;
      }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
      cacheHandler.init();
  });