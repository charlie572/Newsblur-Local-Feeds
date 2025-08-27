import js from "./insert_local_feeds.js"
import hash from "object-hash"

function get_date_string(date) {
    return (
        date.getFullYear()
        + "-"
        + date.getMonth()
        + "-"
        + date.getDate()
        + " "
        + date.getHours()
        + ":"
        + date.getMinutes()
        + ":"
        + date.getSeconds()
    );
}

async function parse_rss(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const text = await response.text();

    const parser = new window.DOMParser();
    const xml = parser.parseFromString(text, "text/xml");

    const title = xml.querySelector("title").textContent;
    const link = xml.querySelector("link").textContent;
    const description = xml.querySelector("description").textContent;
    const image_url = xml.querySelector("url").textContent;

    const item_elements = xml.querySelectorAll("item");
    const items = [];
    for (const item of item_elements) {
        items.push({
            title: item.querySelector("title").textContent,
            description: item.querySelector("description").textContent,
            link: item.querySelector("link").textContent,
            pubDate: new Date(item.querySelector("pubDate").textContent),
            author: item.querySelector("author").textContent,
        });
    }

    return {
        title: title,
        link: link,
        description: description,
        image_url: image_url,
        items: items,
    };
}

function create_story_hash(story_rss_data) {
    return "local_story_" + hash(story_rss_data);
}

function create_story_data(story_rss_data) {
    const story_hash = create_story_hash(story_rss_data);
    const attributes = {
        "story_hash": story_hash,
        "story_tags": [],
        "story_date": get_date_string(story_rss_data.pubDate),
        "story_timestamp": Date.parse(story_rss_data.pubDate),
        "story_authors": story_rss_data.author,
        "story_title": story_rss_data.title,
        "story_content": null,
        "story_permalink": story_rss_data.link,
        "image_urls": [],
        "secure_image_urls": {},
        "secure_image_thumbnails": {},
        "story_feed_id": null,
        "comment_count": null,
        "comment_user_ids": [],
        "share_count": null,
        "share_user_ids": [],
        "id": story_hash,
        "friend_comments": [],
        "friend_shares": [],
        "public_comments": [],
        "reply_count": 0,
        "short_parsed_date": null,
        "long_parsed_date": null,
        "read_status": 0,
        "intelligence": {
            "feed": 1,
            "author": 0,
            "tags": 0,
            "title": 0
        },
        "score": 1,
    };
    return {attributes};
}

async function get_stories(feed_id) {
    const feed_data = await get_feed_from_storage(feed_id);

    /* fetch rss feed */
    const rss_url = feed_data.attributes.feed_address;
    const rss_data = await parse_rss(rss_url);

    /* get all story data in browser */
    const result = await browser.storage.local.get("local_stories");
    var story_data = result.local_stories[feed_id] || [];

    /* create lookup table of stories by hash */
    const story_data_by_hash = {};
    for (var data of story_data) {
        story_data_by_hash[data.attributes.story_hash] = data;
    }

    /* create stories that aren't in browser storage yet */
    story_data = rss_data.items.map(item =>
        story_data_by_hash[create_story_hash(item)] || create_story_data(item)
    );

    /* save stories to browser storage */
    result.local_stories[feed_id] = story_data;
    await browser.storage.local.set({local_stories: result.local_stories});

    return story_data;
}

async function get_story_by_hash(story_hash) {
    /* get all story data in browser */
    const result = await browser.storage.local.get("local_stories");
    const story_data = result.local_stories;

    for (feed_id in story_data) {
        for (data of story_data[feed_id]) {
            if (data.story_hash === story_hash) {
                return data;
            }
        }
    }

    throw new Error("Couldn't find story hash.");
}

async function set_story(data) {
    /* get all story data in browser */
    const result = await browser.storage.local.get("local_stories");
    const story_data = result.local_stories;

    for (var feed_id in story_data) {
        const index = story_data[feed_id].findIndex(
            browser_story_data => browser_story_data.attributes.story_hash === data.attributes.story_hash
        );
        if (index >= 0) {
            story_data[feed_id][index] = data;
            await browser.storage.local.set({local_stories: story_data});
            return;
        }
    }

    throw new Error("Couldn't find story hash.");
}

async function get_feed_from_storage(feed_id) {
    const result = await browser.storage.local.get("local_feeds");
    const feeds = result.local_feeds;
    return feeds[feed_id];
}

const newsblur_origin = "https://www.newsblur.com";
window.addEventListener(
    "message",
    event => {
        if (event.origin !== newsblur_origin) {
            return;
        }
        
        if (event.data.command === "parse_rss") {
            parse_rss(event.data.url)
            .then(rss => {
                event.source.postMessage({
                    command: "rss_result",
                    rss: rss,
                });
            });
        } else if (event.data.command === "get_local_feed") {
            get_feed_from_storage(event.data.feed_id).then(feed_data =>
                event.source.postMessage({
                    command: "local_feed",
                    feed_data: feed_data,
                })
            );
        } else if (event.data.command === "get_local_feeds") {
            browser.storage.local.get("local_feeds").then(result => {
                const feed_data = result.local_feeds;
                event.source.postMessage({
                    command: "local_feeds",
                    feed_data: feed_data,
                });
            });
        } else if (event.data.command === "get_stories") {
            get_stories(event.data.feed_id).then(story_data =>
                event.source.postMessage({
                    command: "stories",
                    story_data: story_data,
                })
            );
        } else if (event.data.command === "get_story_by_hash") {
            get_story_by_hash(event.data.hash).then(story_data =>
                event.source.postMessage({
                    command: "story",
                    story_data: story_data,
                })
            );
        } else if (event.data.command === "set_story") {
            set_story(event.data.story_data);
        } else if (event.data.command === "add_local_feed") {
            browser.storage.local.get("local_feeds").then(result => {
                const feeds = result.local_feeds;
                const feed_data = event.data.feed_data;
                feeds[feed_data.attributes.id] = feed_data;
                browser.storage.local.set({local_feeds: feeds});
            });
        }
    }
);

async function setup_storage() {
    const result = await browser.storage.local.get(["local_feeds", "local_stories"]);

    browser.storage.local.set({
        local_feeds: result.local_feeds || {},
        local_stories: result.local_stories || {},
    });
}
setup_storage();

var script = document.createElement("script");
script.innerText = js;
document.head.appendChild(script);
