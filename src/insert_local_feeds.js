/* 
 * WARNING: single-line comments don't work in this script when it is 
 * injected into newsblur. Use multi-line comments instead.
 */

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
            const feed = create_feed(feed_data.attributes, feed_data.folders);
            message_resolvers.get("local_feed")(feed);
            message_resolvers.delete("local_feed");
        } else if (event.data.command === "local_feeds") {
            const feed_data = event.data.feed_data;
            const feeds = {};
            for (var id in feed_data) {
                feeds[id] = create_feed(
                    feed_data[id].attributes, 
                    feed_data[id].folders,
                );
            }
            message_resolvers.get("local_feeds")(feeds);
            message_resolvers.delete("local_feeds");
        }
    }
);

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

function create_story(story_data) {
    const attributes = {
        "story_hash": null,
        "story_tags": [],
        "story_date": get_date_string(story_data.pubDate),
        "story_timestamp": Date.parse(story_data.pubDate),
        "story_authors": story_data.author,
        "story_title": story_data.title,
        "story_content": null,
        "story_permalink": story_data.link,
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
        "id": story_data.link,
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

    const story = new NEWSBLUR.Models.Story(attributes);

    return story;
}

async function parse_rss(url) {
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

async function get_local_feed_from_storage(feed_id) {
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

async function get_local_feeds_from_storage() {
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

function add_local_feed_to_storage(feed) {
    const folder_names = feed.folders.map(folder => folder.get("folder_title").toLowerCase());
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

async function load_local_feeds() {
    const feeds = await get_local_feeds_from_storage();
    for (var id in feeds) {
        add_feed_to_document(feeds[id]);
    }
}

async function load_local_feed(feed_id) {
    const feed = await get_local_feed_from_storage(feed_id);
    const rss_address = feed.get("feed_address");

    const rss_data = await parse_rss(rss_address);

    const stories = rss_data.items.map(create_story);
    NEWSBLUR.assets.stories.reset(stories, { added: stories.length });
}

function create_feed(attributes, folders) {
    const feed = new NEWSBLUR.Models.Feed(attributes);

    /* 
     * In Newsblur, feed.folders doesn't seem to contain NEWSBLUR.Models.Folder
     * objects. It seems to contain the result of an AJAX request instead. I'm 
     * just going to use Folder objects though. I can't see how to construct
     * the proper objects.
     */
    feed.folders = folders.map(name => NEWSBLUR.assets.folders.find_folder(name));
    return feed;
}

async function add_local_feed(rss_url, folder_name) {
    rss_data = await parse_rss(rss_url);

    /* new feed data */
    const feed_id = -1;
    const feed_attributes = {
        "id": feed_id,
        "feed_title": rss_data.title,
        "feed_address": rss_url,
        "feed_link": rss_data.link,
        "num_subscribers": 28,
        "updated": "52 minutes",
        "updated_seconds_ago": 3179,
        "fs_size_bytes": 4130982,
        "archive_count": 332,
        "last_story_date": "2025-08-21 11:00:00",
        "last_story_seconds_ago": 121182,
        "stories_last_month": 11,
        "average_stories_per_month": 6,
        "min_to_decay": 240,
        "subs": 28,
        "is_push": true,
        "is_newsletter": false,
        "fetched_once": true,
        "search_indexed": true,
        "discover_indexed": true,
        "not_yet_fetched": false,
        "favicon_color": "ff184a",
        "favicon_fade": "ff3668",
        "favicon_border": "bf1237",
        "favicon_text_color": "white",
        "favicon_fetching": false,
        "favicon_url": rss_data.image_url,
        "s3_page": false,
        "s3_icon": true,
        "disabled_page": false,
        "similar_feeds": [],
        "ps": 0,
        "nt": 2,
        "ng": 0,
        "active": true,
        "feed_opens": 4,
        "subscribed": true,
        "selected": false
    };

    /* get folder */
    folder_name = folder_name.split(":")[1].toLowerCase();
    const folder = NEWSBLUR.assets.folders.find_folder(folder_name);

    /* create feed model instance */
    const feed = create_feed(feed_attributes, [folder_name]);

    add_local_feed_to_storage(feed);

    add_feed_to_document(feed)
}

function add_feed_to_document(feed) {
    for (var folder of feed.folders) {
        /* create feed view */
        const depth = folder.folder_view.options.depth;
        const view = new NEWSBLUR.Views.FeedTitleView({
            model: feed,
            type: 'feed',
            depth: depth,
            folder_title: folder.get("folder_title"),
            folder: folder,
        }).render();
        feed.views.push(view);

        /* add feed view to document */
        const folder_element = folder.folder_view.el.querySelector(".folder");
        folder_element.appendChild(view.el);
    }
}

function main() {
    /* override load_feed method */
    const load_feed = NEWSBLUR.AssetModel.prototype.load_feed;
    NEWSBLUR.AssetModel.prototype.load_feed = function (feed_id, page, first_load, callback, error_callback) {
        if (feed_id < 0) {
            load_local_feed(feed_id);
        } else {
            load_feed.call(
                NEWSBLUR.assets, feed_id, page, first_load, callback, error_callback
            );
        }
    };

    /* add button to ReaderAddFeed dialog */
    const render_reader_add_feed = NEWSBLUR.ReaderAddFeed.prototype.render;
    NEWSBLUR.ReaderAddFeed.prototype.render = function () {
        render_reader_add_feed.call(this);

        const button = document.createElement("div");
        button.className = "NB-modal-submit-button NB-modal-submit-green";
        button.innerText = "Add local site";
        button.style.float = "right";
        button.style.margin = "6px 0 6px 0";

        const url = this.el.querySelector(".NB-add-url");
        const folder = this.el.querySelector(".NB-folders");
        button.onclick = () => add_local_feed(url.value, folder.value);

        const add_site_group = this.el.querySelector(".NB-add-site");
        add_site_group.appendChild(button);
    };

    setTimeout(load_local_feeds, 2000);
}

main();
