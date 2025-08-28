/* 
 * WARNING: single-line comments don't work in this script when it is 
 * injected into newsblur. Use multi-line comments instead.
 */

import * as messages from "./messages.js";
import * as models from "./models.js";
import hash from "object-hash";
import { is_string } from "./utils.js";

async function load_local_feeds() {
    const feeds = await messages.get_local_feeds_from_storage();
    for (var id in feeds) {
        add_feed_to_document(feeds[id]);
    }
}

async function load_local_feed(feed_id) {
    const stories = await messages.get_stories(feed_id);
    NEWSBLUR.assets.stories.reset(stories, { added: stories.length });
}

function create_feed_id(rss_url) {
    return "local_feed_" + hash(rss_url);
}

async function add_local_feed(rss_url, folder_name) {
    const rss_data = await messages.parse_rss(rss_url);

    /* new feed data */
    const feed_attributes = {
        "id": create_feed_id(rss_url),
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
        "nt": 2,
        "ng": 0,
        "feed_opens": 4,
        "subscribed": true,
    };

    /* get folder */
    folder_name = folder_name.split(":")[1].toLowerCase();
    const folder = NEWSBLUR.assets.folders.find_folder(folder_name);

    /* create feed model instance */
    const feed = models.create_feed(feed_attributes, [folder_name]);

    messages.add_local_feed_to_storage(feed);

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

    const load_feed = NEWSBLUR.AssetModel.prototype.load_feed;
    NEWSBLUR.AssetModel.prototype.load_feed = function (feed_id, page, first_load, callback, error_callback) {
        if (is_string(feed_id) && feed_id.startsWith("local_feed_")) {
            load_local_feed(feed_id);
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
