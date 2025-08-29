import * as messages from "./messages.js";

async function fetch_local_feeds(feeds, subscriptions) {
    const feed_data = await messages.get_local_feeds_from_storage();

    for (const id in feed_data) {
        /* feed object */
        const feed = new NEWSBLUR.Models.Feed(feed_data[id].attributes);
        NEWSBLUR.assets.feeds.add(feed);

        /* feed data to return from feeds.fetch() */
        const feed_data_nb = {};
        Object.assign(feed_data_nb, feed_data[id].attributes);
        feeds.push(feed_data_nb);

        /* folders */
        for (const folder_name of feed_data[id].folders) {
            const success = add_to_folder_tree(Number(id), folder_name, subscriptions.folders);
            if (!success) throw new Error("Couldn't find folder. " + folder_name);
        }
    }

    return {feeds, subscriptions};
}

/*
 * Recursively search for target_folder_name (case-insensitive), and add feed_id to it.
 */
function add_to_folder_tree(feed_id, target_folder_name, folders) {
    if (target_folder_name === "") {
        folders.unshift(feed_id);
        return true;
    }

    target_folder_name = target_folder_name.toLowerCase();

    for (const item of folders) {
        if (typeof item === "number") continue;

        const folder_name = Object.keys(item)[0];
        const elements = item[folder_name];

        if (folder_name.toLowerCase() === target_folder_name) {
            elements.push(feed_id);
            return true;
        } else {
            const success = add_to_folder_tree(feed_id, target_folder_name, elements);
            if (success) return true;
        }
    }

    return false;
}

async function load_local_feed(feed_id, page, first_load, callback, error_callback) {
    const feed = await messages.get_local_feed_from_storage(feed_id);
    const stories = await messages.get_stories(feed_id);

    const data = {};
    Object.assign(data, feed.attributes);
    delete data.id;
    data.feed_id = feed_id;
    data.stories = stories.map(story => story.attributes);

    NEWSBLUR.assets.feed_id = feed_id;
    NEWSBLUR.assets.load_feed_precallback(data, feed_id, callback, first_load);
}

async function add_local_feed(rss_url, folder_name) {
    const rss_data = await messages.parse_rss(rss_url);

    /* new feed data */
    const feed_attributes = {
        "id": await messages.get_new_feed_id(),
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
        "search_indexed": true,
        "discover_indexed": true,
        "favicon_color": "ff184a",
        "favicon_fade": "ff3668",
        "favicon_border": "bf1237",
        "favicon_text_color": "white",
        "favicon_fetching": false,
        "favicon_url": rss_data.image_url,
        "s3_page": false,
        "s3_icon": true,
        "similar_feeds": [],
        "ps": 0,
        "nt": rss_data.items.length,
        "ng": 0,
        "active": true,
        "fetched_once": true,
        "has_exception": false,
        "feed_opens": 4,
        "subscribed": true,
    };

    folder_name = folder_name.split(":")[1].toLowerCase();

    messages.add_local_feed_to_storage({
        attributes: feed_attributes, 
        folders: [folder_name],
    });

    NEWSBLUR.assets.load_feeds();
}

function mark_story_as_read(story, read) {
    story.set("read_status", read ? 1 : 0);
    messages.set_story(story);
}

async function mark_story_id_as_read(story_id, read) {
    const story = NEWSBLUR.assets.stories.get(story_id);
    mark_story_as_read(story, read);
}

function main() {
    /* 
     * Override NESBLUR.AssetModel methods, redirecting them to 
     * other methods if arguments are for local feeds.
     */

    const fetch_feeds = NEWSBLUR.Collections.Feeds.prototype.fetch;
    NEWSBLUR.Collections.Feeds.prototype.fetch = function (options) {
        const callback = options.success;
        options.success = (feeds, subscriptions) => (
            fetch_local_feeds(feeds, subscriptions)
            .then(result => {
                callback(result.feeds, result.subscriptions)
            })
        );
        fetch_feeds.call(NEWSBLUR.assets.feeds, options);
    };

    const load_feed = NEWSBLUR.AssetModel.prototype.load_feed;
    NEWSBLUR.AssetModel.prototype.load_feed = function (feed_id, page, first_load, callback, error_callback) {
        if (feed_id < 0) {
            load_local_feed(feed_id, page, first_load, callback, error_callback);
        } else {
            load_feed.call(
                NEWSBLUR.assets, feed_id, page, first_load, callback, error_callback
            );
        }
    };

    const mark_story_hash_as_read = NEWSBLUR.AssetModel.prototype.mark_story_hash_as_read;
    NEWSBLUR.AssetModel.prototype.mark_story_hash_as_read = function(story, callback, error_callback, data) {
        if (story.get("story_hash").startsWith("local_story_")) {
            mark_story_as_read(story, true);
        } else {
            mark_story_hash_as_read.call(NEWSBLUR.assets, story, callback, error_callback, data);
        }
    };

    const mark_story_as_unread = NEWSBLUR.AssetModel.prototype.mark_story_as_unread;
    NEWSBLUR.AssetModel.prototype.mark_story_as_unread = function(story_id, feed_id, callback, error_callback) {
        if (story_id.startsWith("local_story_")) {
            mark_story_id_as_read(story_id, false);
        } else {
            mark_story_as_unread.call(NEWSBLUR.assets, story_id, feed_id, callback, error_callback);
        }
    };

    const move_feed_to_folder = NEWSBLUR.AssetModel.prototype.move_feed_to_folder;
    NEWSBLUR.AssetModel.prototype.move_feed_to_folder = function(feed_id, in_folder, to_folder, callback) {
        if (feed_id < 0) {
            messages.set_feed_folders_in_storage(feed_id, [to_folder]);
            NEWSBLUR.assets.load_feeds(callback);
        } else {
            move_feed_to_folder.call(NEWSBLUR.assets, feed_id, in_folder, to_folder, callback);
        }
    };

    const move_feed_to_folders = NEWSBLUR.AssetModel.prototype.move_feed_to_folders;
    NEWSBLUR.AssetModel.prototype.move_feed_to_folders = function(feed_id, in_folders, to_folders, callback) {
        if (feed_id < 0) {
            messages.set_feed_folders_in_storage(feed_id, to_folders);
            NEWSBLUR.assets.load_feeds(callback);
        } else {
            move_feed_to_folder.call(NEWSBLUR.assets, feed_id, in_folders, to_folders, callback);
        }
    };

    const move_feeds_by_folder = NEWSBLUR.AssetModel.prototype.move_feeds_by_folder;
    NEWSBLUR.AssetModel.prototype.move_feeds_by_folder = function(feeds_by_folder, to_folder, new_folder, callback, error_callback) {
        // separate into local and non-local feeds
        const local_feeds_by_folder = feeds_by_folder.filter(item => item[0] < 0);
        feeds_by_folder = feeds_by_folder.filter(item => item[0] >= 0);

        // move local feeds
        var destination = new_folder || to_folder.split(":")[1].toLowerCase();
        for (const item of local_feeds_by_folder) {
            messages.set_feed_folders_in_storage(item[0], [destination]);
        }

        // Call NEWSBLUR.assets.load_feeds once all the feeds are moved.
        const pre_callback = () => NEWSBLUR.assets.load_feeds(callback);

        // move non-local feeds
        if (feeds_by_folder.length > 0) {
            move_feeds_by_folder.call(NEWSBLUR.assets, feeds_by_folder, to_folder, new_folder, pre_callback, error_callback);
        } else {
            pre_callback();
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
}

main();
