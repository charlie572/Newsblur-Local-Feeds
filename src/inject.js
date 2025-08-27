import js from "./insert_local_feeds.js"

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

function create_story_data(story_rss_data) {
    const attributes = {
        "story_hash": null,
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
        "has_modifications": false,
        "comment_count": null,
        "comment_user_ids": [],
        "share_count": null,
        "share_user_ids": [],
        "guid_hash": null,
        "id": story_rss_data.link,
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
        "visible": true,
        "images_loaded": true
    };
    return {attributes};
}

async function get_stories(feed_id) {
    const feed_data = await get_feed_from_storage(feed_id);
    const rss_url = feed_data.attributes.feed_address;
    const rss_data = await parse_rss(rss_url);
    const story_data = rss_data.items.map(create_story_data);
    return story_data;
}

async function get_feed_from_storage(feed_id) {
    const result = await browser.storage.sync.get("local_feeds");
    const feeds = result.local_feeds;
    return feeds[String(feed_id)];
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
            browser.storage.sync.get("local_feeds").then(result => {
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
        } else if (event.data.command === "add_local_feed") {
            browser.storage.sync.get("local_feeds").then(result => {
                const feeds = result.local_feeds;
                const feed_data = event.data.feed_data;
                feeds[feed_data.attributes.id] = feed_data;
                browser.storage.sync.set({local_feeds: feeds});
            });
        }
    }
);

async function setup_storage() {
    // check if local_feeds is defined in browser storage
    const result = await browser.storage.sync.get("local_feeds");
    if ("local_feeds" in result) {
        return
    }

    // initialise local storage
    browser.storage.sync.set({
        local_feeds: {}
    });
}
setup_storage();

var script = document.createElement("script");
script.innerText = js;
document.head.appendChild(script);
