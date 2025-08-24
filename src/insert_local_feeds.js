/* 
 * WARNING: single-line comments don't work in this script when it is 
 * injected into newsblur. Use multi-line comments instead.
 */

LocalFeedTitleView = NEWSBLUR.Views.FeedTitleView.extend({
    open: function (e, options) {
        console.log("Opening local feed");
    }
});

async function main() {
    /* new feed data */
    const rss_url = "http://localhost:1200/spotify/artist/6N3egqZ7OtcYYXyU6PBdNr";
    const feed_url = "https://open.spotify.com/artist/6N3egqZ7OtcYYXyU6PBdNr";
    const image_url = "https://i.scdn.co/image/ab6761610000e5eb100da61a04b3858e789ebeab";
    const feed_id = 9999999;
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

    /* get root folder */
    const folder = NEWSBLUR.assets.folders.find_folder("");

    /* create feed view */
    const view = new LocalFeedTitleView({
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
