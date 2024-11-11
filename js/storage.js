/**
 * Storage utility object for managing localStorage operations
 * All methods handle JSON parsing/stringifying and error cases
 */
const Storage = {
    // Retrieve and parse stored value
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    },

    // Store value as JSON string
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },

    // Delete specific key
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Remove all stored data
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            return false;
        }
    }
};