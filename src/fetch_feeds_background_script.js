import * as storage from "./storage.js";
import { parse_rss } from "./rss.js";

const FETCH_PERIOD = 10 * 60 * 1000;  // milliseconds between fetches for a feed

async function fetch_feed(feed_data) {
    const rss_url = feed_data.attributes.feed_address;
    const rss_data = await parse_rss(rss_url);
    await storage.update_feed_stories(feed_data.attributes.id, rss_data.items);
}

async function fetch_feeds() {
    const feeds = await storage.get_local_feeds();
    for (const id in feeds) {
        const feed_data = feeds[id];
        if (Date.now() - feed_data.last_fetch >= FETCH_PERIOD) {
            await fetch_feed(feed_data);
        }
    }
}

browser.alarms.create(
    "fetch_local_feeds", 
    { periodInMinutes: 1 },
);

browser.alarms.onAlarm.addListener(event => {
    if (event.name === "fetch_local_feeds") {
        fetch_feeds();
    }
})
