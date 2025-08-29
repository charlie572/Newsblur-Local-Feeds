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
            message_resolvers.get("local_feed")(event.data.feed_data);
            message_resolvers.delete("local_feed");
        } else if (event.data.command === "local_feeds") {
            message_resolvers.get("local_feeds")(event.data.feed_data);
            message_resolvers.delete("local_feeds");
        } else if (event.data.command === "stories") {
            message_resolvers.get("stories")(event.data.story_data);
            message_resolvers.delete("stories");
        } else if (event.data.command === "story") {
            message_resolvers.get("story")(event.data.story_data);
            message_resolvers.delete("story");
        } else if (event.data.command === "feed") {
            message_resolvers.get("feed")(event.data.feed_data);
            message_resolvers.delete("feed");
        } else if (event.data.command === "new_feed_id") {
            message_resolvers.get("new_feed_id")(event.data.new_feed_id);
            message_resolvers.delete("new_feed_id");
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

export async function get_new_feed_id() {
    window.postMessage(
        {
            command: "get_new_feed_id",
        },
        "*",
    );

    let { promise, resolve, reject } = Promise.withResolvers();
    message_resolvers.set("new_feed_id", resolve);
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

export function add_local_feed_to_storage(feed_data) {
    window.postMessage(
        {
            command: "add_local_feed",
            feed_data: feed_data,
        },
        "*",
    );
}
