import js from "../injected_dist/insert_local_feeds.js"
import * as storage from "./storage.js";

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

    var image_url = null;
    const image_element = xml.querySelector("image url");
    if (image_element) {
        image_url = image_element.textContent;
    }

    const item_elements = xml.querySelectorAll("item");
    const items = [];
    for (const item of item_elements) {
        /* get categories */
        var categories = Array.from(item.querySelectorAll("category"));
        categories = categories.map(cat => cat.textContent);

        /* get content */
        var content = null;
        const content_element = item.getElementsByTagName("content:encoded");
        if (content_element) {
            content = content_element.textContent;
        }

        items.push({
            title: item.querySelector("title").textContent,
            description: item.querySelector("description").textContent,
            link: item.querySelector("link").textContent,
            pubDate: new Date(item.querySelector("pubDate").textContent),
            author: item.querySelector("author").textContent,
            categories: categories,
            content: content,
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
            storage.get_feed_from_storage(event.data.feed_id).then(feed_data =>
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
            storage.get_stories(event.data.feed_id).then(story_data =>
                event.source.postMessage({
                    command: "stories",
                    story_data: story_data,
                })
            );
        } else if (event.data.command === "get_story_by_hash") {
            storage.get_story_by_hash(event.data.hash).then(story_data =>
                event.source.postMessage({
                    command: "story",
                    story_data: story_data,
                })
            );
        } else if (event.data.command === "set_story") {
            storage.set_story(event.data.story_data);
        } else if (event.data.command === "add_local_feed") {
            browser.storage.local.get("local_feeds").then(result => {
                const feeds = result.local_feeds;
                const feed_data = event.data.feed_data;
                feeds[feed_data.attributes.id] = feed_data;
                browser.storage.local.set({local_feeds: feeds});
            });
        } else if (event.data.command === "get_new_feed_id") {
            storage.get_new_feed_id().then(new_feed_id =>
                event.source.postMessage({
                    command: "new_feed_id",
                    new_feed_id: new_feed_id,
                })
            );
        } else if (event.data.command === "set_feed_folders") {
            storage.set_feed_folders(event.data.feed_id, event.data.folders);
        } else if (event.data.command === "delete_feed_in_folder") {
            storage.delete_feed_in_folder(event.data.feed_id, event.data.folder);
        } else if (event.data.command === "get_feeds_trainer") {
            storage.get_feeds_trainer(event.data.feed_id).then(feeds_trainer => {
                event.source.postMessage({
                    command: "feeds_trainer",
                    feeds_trainer: feeds_trainer,
                });
            });
        } else if (event.data.command === "save_classifier") {
            storage.save_classifier(event.data.classifier_update);
        }
    }
);

var script = document.createElement("script");
script.innerText = js;
document.head.appendChild(script);
