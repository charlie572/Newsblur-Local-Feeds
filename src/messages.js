import * as models from "./models.js";

const message_resolvers = new Map();
const newsblur_origin = "https://www.newsblur.com";
window.addEventListener(
    "message",
    event => {
        if (event.origin !== newsblur_origin) {
            return;
        }

        if (event.data.command === "rss_result") {
            message_resolvers.get("rss_result")(event.data.rss);
            message_resolvers.delete("rss_result");
        } else if (event.data.command === "local_feed") {
            const feed_data = event.data.feed_data;
            const feed = models.create_feed(feed_data.attributes, feed_data.folders);
            message_resolvers.get("local_feed")(feed);
            message_resolvers.delete("local_feed");
        } else if (event.data.command === "local_feeds") {
            const feed_data = event.data.feed_data;
            const feeds = {};
            for (var id in feed_data) {
                feeds[id] = models.create_feed(
                    feed_data[id].attributes, 
                    feed_data[id].folders,
                );
            }
            message_resolvers.get("local_feeds")(feeds);
            message_resolvers.delete("local_feeds");
        } else if (event.data.command === "stories") {
            const story_data = event.data.story_data;
            const stories = story_data.map(data =>
                new NEWSBLUR.Models.Story(data.attributes)
            );
            message_resolvers.get("stories")(stories);
            message_resolvers.delete("stories");
        } else if (event.data.command === "story") {
            const story_data = event.data.story_data;
            const story = new NEWSBLUR.Models.Story(story_data.attributes)
            message_resolvers.get("story")(story);
            message_resolvers.delete("story");
        }
    }
);

export async function parse_rss(url) {
    window.postMessage(
        {
            command: "parse_rss",
            url: url,
        },
        "*",
    );

    let { promise, resolve, reject } = Promise.withResolvers();
    message_resolvers.set("rss_result", resolve);
    return promise;
}

export async function get_local_feed_from_storage(feed_id) {
    window.postMessage(
        {
            command: "get_local_feed",
            feed_id: feed_id,
        },
        "*",
    );

    let { promise, resolve, reject } = Promise.withResolvers();
    message_resolvers.set("local_feed", resolve);
    return promise;
}

export async function get_local_feeds_from_storage() {
    window.postMessage(
        {
            command: "get_local_feeds",
        },
        "*",
    );

    let { promise, resolve, reject } = Promise.withResolvers();
    message_resolvers.set("local_feeds", resolve);
    return promise;
}

export async function get_stories(feed_id) {
    window.postMessage(
        {
            command: "get_stories",
            feed_id: feed_id,
        },
        "*",
    );

    let { promise, resolve, reject } = Promise.withResolvers();
    message_resolvers.set("stories", resolve);
    return promise;
}

export async function get_story_by_hash(hash) {
    window.postMessage(
        {
            command: "get_story_by_hash",
            feed_data: {
                hash: hash,
            },
        },
        "*",
    );

    let { promise, resolve, reject } = Promise.withResolvers();
    message_resolvers.set("story", resolve);
    return promise;
}

export function set_story(story) {
    const attributes = {};
    Object.assign(attributes, story.attributes);
    delete attributes.selected;
    delete attributes.images_loaded;
    delete attributes.visible;
    delete attributes.share_user_ids;

    window.postMessage(
        {
            command: "set_story",
            story_data: {
                attributes: attributes,
            }
        },
        "*",
    );
}

export function add_local_feed_to_storage(feed) {
    const folder_names = feed.folders.map(folder => {
        if ("options" in folder) {
            /* root folder */
            return "";
        } else {
            return folder.get("folder_title").toLowerCase();
        }
    });

    window.postMessage(
        {
            command: "add_local_feed",
            feed_data: {
                attributes: feed.attributes,
                folders: folder_names,
            },
        },
        "*",
    );
}
