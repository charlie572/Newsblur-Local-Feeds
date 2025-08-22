const path = require('path');

module.exports = {
    entry: './src/inject.js',
    mode: 'production',
    output: {
        filename: 'inject.js',
    },
    module: {
        rules: [
            {
                test: path.resolve(__dirname, 'src/insert_local_feeds.js'),
                type: 'asset/source',
            },
        ],
    },
};