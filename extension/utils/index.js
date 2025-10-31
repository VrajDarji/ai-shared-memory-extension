// Central export file for all utility functions
// This allows content.js to access all utilities through a single import point

// Export scraping utilities
// Note: In Chrome extensions without module system, these will be available globally
// Functions are attached to window object for cross-file access

if (typeof window !== 'undefined') {

    window.SabkiSochUtils = window.SabkiSochUtils || {};

    // Import and attach scraping functions (they need to be defined in scraping.js first)
    // Since we can't use ES6 modules in content scripts, functions will be available globally
    // after their respective files are loaded
}

// Note: In Chrome extensions with manifest v3 content scripts,
// files are loaded in order but share the same global scope.
// So functions from scraping.js, dom-utils.js, storage.js, and api.js
// will all be available in the global scope after they're loaded.
// This index.js file serves as documentation and can be used for future
// module bundling if needed.

