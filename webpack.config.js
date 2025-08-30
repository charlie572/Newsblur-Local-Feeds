const path = require('path');

module.exports = [
    {
        // This bundle injects the bundle above into the Newsblur page.
        entry: './src/local_feeds_dom_only',
        mode: 'production',
        output: {
            filename: 'local_feeds_dom_only.js',
        },
    },
];