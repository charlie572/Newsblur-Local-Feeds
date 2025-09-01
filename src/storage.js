import { parse_rss } from "./rss.js";
import hash from "object-hash";

export function create_story_hash(story_rss_data) {
    return "local_story_" + hash(story_rss_data);
}

export function create_story_data(story_rss_data) {
    const story_hash = create_story_hash(story_rss_data);
    const attributes = {
        "story_hash": story_hash,
        "story_tags": story_rss_data.categories,
        "story_timestamp": Math.floor(Date.parse(story_rss_data.pubDate) / 1000),
        "story_authors": story_rss_data.author,
        "story_title": story_rss_data.title,
        "story_content": story_rss_data.content,
        "story_permalink": story_rss_data.link,
        "image_urls": [],
        "secure_image_urls": {},
        "secure_image_thumbnails": {},
        "story_feed_id": null,
        "comment_count": null,
        "comment_user_ids": [],
        "share_count": null,
        "share_user_ids": [],
        "id": story_hash,
        "friend_comments": [],
        "friend_shares": [],
        "public_comments": [],
        "reply_count": 0,
        "read_status": 0,
        "intelligence": {
            "feed": 1,
            "author": 0,
            "tags": 0,
            "title": 0
        },
        "score": 1,
    };
    return {attributes};
}

export async function get_stories(feed_id) {
    const feed_data = await get_feed_from_storage(feed_id);

    /* fetch rss feed */
    const rss_url = feed_data.attributes.feed_address;
    const rss_data = await parse_rss(rss_url);

    /* get all story data in browser */
    const result = await browser.storage.local.get([
        "local_stories",
        "feed_story_hashes"
    ]);
    const story_hashes = result.feed_story_hashes[feed_id] || [];
    const local_stories = result.local_stories;

    /* create stories that aren't in browser storage yet */
    const story_data = [];
    for (const item of rss_data.items) {
        const story_hash = create_story_hash(item);
        if (story_hash in local_stories) {
            story_data.push(local_stories[story_hash]);
        } else {
            const data = create_story_data(item);
            local_stories[story_hash] = data;
            story_data.push(data);
        }
    }

    /* save stories to browser storage */
    result.local_stories[feed_id] = story_data;
    await browser.storage.local.set(result);

    return story_data;
}

export async function get_story_by_hash(story_hash) {
    const result = await browser.storage.local.get("local_stories");
    return result.local_stories[story_hash];
}

export async function set_story(data) {
    /* get all story data in browser */
    const result = await browser.storage.local.get("local_stories");
    result.local_stories[data.attributes.story_hash] = data;
    await browser.storage.local.set(result);
}

export async function get_feed_from_storage(feed_id) {
    const result = await browser.storage.local.get("local_feeds");
    const feeds = result.local_feeds;
    return feeds[feed_id];
}

export async function get_new_feed_id() {
    const result = await browser.storage.local.get("next_feed_id");
    const new_feed_id = result.next_feed_id;
    await browser.storage.local.set({next_feed_id: new_feed_id - 1});
    return new_feed_id;
}

export async function set_feed_folders(feed_id, folders) {
    const result = await browser.storage.local.get("local_feeds");
    result.local_feeds[feed_id].folders = folders;
    await browser.storage.local.set(result);
}

export async function delete_feed_in_folder(feed_id, folder) {
    const result = await browser.storage.local.get([
        "local_feeds",
        "feed_story_hashes",
    ]);
    const folders = result.local_feeds[feed_id].folders;
    
    // delete folder from array
    const index = folders.findIndex(
        name => name.toLowerCase() === folder.toLowerCase()
    );
    if (index >= 0) {
        folders.splice(index);
    }

    if (folders.length == 0) {
        delete result.local_feeds[feed_id];
        delete result.feed_story_hashes[feed_id];
    }

    await browser.storage.local.set(result);
}

export async function get_local_feeds() {
    const result = await browser.storage.local.get("local_feeds");
    return result.local_feeds;
}

export async function add_local_feed_to_storage(feed_data) {
    const result = await browser.storage.local.get("local_feeds");
    result.local_feeds[feed_data.attributes.id] = feed_data;
    await browser.storage.local.set(result);
}

export async function setup_storage() {
    const result = await browser.storage.local.get([
        "local_feeds", 
        "local_stories", 
        "feed_story_hashes",
        "next_feed_id",
    ]);

    browser.storage.local.set({
        local_feeds: result.local_feeds || {},
        local_stories: result.local_stories || {},
        feed_story_hashes: result.feed_story_hashes || {},
        next_feed_id: result.next_feed_id || -1,
    });
}

export async function get_num_unread(feed_id) {
    const stories = await get_stories(feed_id);
    return stories.filter(story => story.attributes.read_status === 0).length;
}
