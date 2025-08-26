import js from "./insert_local_feeds.js"

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
            browser.storage.sync.get("local_feeds").then(result => {
                const feeds = result.local_feeds;
                const attributes = feeds[String(event.data.feed_id)];
                event.source.postMessage({
                    command: "local_feed",
                    attributes: attributes,
                });
            });
        } else if (event.data.command === "add_local_feed") {
            browser.storage.sync.get("local_feeds").then(result => {
                const feeds = result.local_feeds;
                feeds[event.data.attributes.id] = event.data.attributes;
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
