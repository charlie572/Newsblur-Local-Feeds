const path = require('path');

module.exports = [
    {
        // This bundle injects the bundle above into the Newsblur page.
        entry: {
            newsblur_content: './src/newsblur_content_script.js', 
            fetch_feeds_background: './src/fetch_feeds_background_script.js'
        },
        mode: 'production',
        output: {
            filename: '[name].js',
            path: __dirname + '/dist',
        },
    },
];