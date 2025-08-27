const path = require('path');

module.exports = [
    {
        // This bundle will be injected into the Newsblur page. It
        // will be loaded by inject.js as text. It must be built first.
        entry: './src/insert_local_feeds.js',
        mode: 'production',
        output: {
            path: __dirname + "/injected_dist",
            filename: 'insert_local_feeds.js',
        },
    },
    {
        // This bundle injects the bundle above into the Newsblur page.
        entry: './src/inject.js',
        mode: 'production',
        output: {
            filename: 'inject.js',
        },
        module: {
            rules: [
                {
                    test: path.resolve(__dirname, 'injected_dist/insert_local_feeds.js'),
                    type: 'asset/source',
                },
            ],
        },
    },
];