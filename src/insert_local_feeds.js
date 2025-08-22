async function main() {
    var feed = NEWSBLUR.assets.feeds.models[1];
    NEWSBLUR.reader.open_feed(feed.id)
}

setTimeout(main, 5000);
