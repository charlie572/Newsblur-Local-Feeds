/* 
 * WARNING: single-line comments don't work in this script when it is 
 * injected into newsblur. Use multi-line comments instead.
 */

const local_feeds = new Map();

const message_resolvers = new Map();
const newsblur_origin = "https://www.newsblur.com";
window.addEventListener(
    "message",
    event => {
        if (
            event.origin == newsblur_origin
            && event.data.command == "rss_result"
        ) {
            message_resolvers.get("rss_result")(event.data.rss);
            message_resolvers.delete("rss_result");
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
    console.log("Posting message");
    window.postMessage(
        {
            command: "parse_rss",
            url: url,
        },
        "*",
    );

    let {promise, resolve, reject} = Promise.withResolvers();
    message_resolvers.set("rss_result", resolve);
    return promise;
}

async function load_local_feed(feed_id) {
    const feed = local_feeds.get(feed_id);
    const rss_address = feed.get("feed_address");

    rss_data = await parse_rss(rss_address);
    
    const stories = rss_data.items.map(create_story);
    NEWSBLUR.assets.stories.reset(stories, { added: stories.length });
}

async function main() {
    /* override load_feed method */
    NEWSBLUR.assets.load_feed = function (feed_id, page, first_load, callback, error_callback) {
        if (feed_id < 0) {
            load_local_feed(feed_id);
        } else {
            NEWSBLUR.assets.constructor.prototype.load_feed.call(
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

        const add_site_group = this.el.querySelector(".NB-add-site");
        add_site_group.appendChild(button);
    };

    /* new feed data */
    const rss_url = "http://localhost:1200/spotify/artist/6N3egqZ7OtcYYXyU6PBdNr";
    const feed_url = "https://open.spotify.com/artist/6N3egqZ7OtcYYXyU6PBdNr";
    const image_url = "https://i.scdn.co/image/ab6761610000e5eb100da61a04b3858e789ebeab";
    const feed_id = -1;
    const feed_title = "Albums of TWRP";

    const feed_attributes = {
        "id": feed_id,
        "feed_title": feed_title,
        "feed_address": rss_url,
        "feed_link": feed_url,
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
        "favicon_url": image_url,
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

    /* create feed model instance */
    const feed = new NEWSBLUR.Models.Feed(feed_attributes);
    local_feeds.set(feed.id, feed);

    /* get root folder */
    const folder = NEWSBLUR.assets.folders.find_folder("");

    /* create feed view */
    const view = new NEWSBLUR.Views.FeedTitleView({
        model: feed,
        type: 'feed',
        depth: 0,
        folder_title: "",
        folder: folder,
    }).render();
    feed.views.push(view);

    /* add feed view to document */
    const root_folder_element = document.getElementsByClassName("NB-root")[0];
    const first_feed = root_folder_element.children[0];
    root_folder_element.insertBefore(view.el, first_feed);
}

setTimeout(main, 5000);
