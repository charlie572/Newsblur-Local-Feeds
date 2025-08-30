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
    const result = await browser.storage.local.get("local_stories");
    var story_data = result.local_stories[feed_id] || [];

    /* create lookup table of stories by hash */
    const story_data_by_hash = {};
    for (var data of story_data) {
        story_data_by_hash[data.attributes.story_hash] = data;
    }

    /* create stories that aren't in browser storage yet */
    story_data = rss_data.items.map(item =>
        story_data_by_hash[create_story_hash(item)] || create_story_data(item)
    );

    /* save stories to browser storage */
    result.local_stories[feed_id] = story_data;
    await browser.storage.local.set({local_stories: result.local_stories});

    return story_data;
}

export async function get_story_by_hash(story_hash) {
    /* get all story data in browser */
    const result = await browser.storage.local.get("local_stories");
    const story_data = result.local_stories;

    for (var feed_id in story_data) {
        for (var data of story_data[feed_id]) {
            if (data.story_hash === story_hash) {
                return data;
            }
        }
    }

    throw new Error("Couldn't find story hash.");
}

export async function set_story(data) {
    /* get all story data in browser */
    const result = await browser.storage.local.get("local_stories");
    const story_data = result.local_stories;

    for (var feed_id in story_data) {
        const index = story_data[feed_id].findIndex(
            browser_story_data => browser_story_data.attributes.story_hash === data.attributes.story_hash
        );
        if (index >= 0) {
            story_data[feed_id][index] = data;
            await browser.storage.local.set({local_stories: story_data});
            return;
        }
    }

    throw new Error("Couldn't find story hash.");
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
    const result = await browser.storage.local.get("local_feeds");
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
    }

    await browser.storage.local.set(result);
}

export async function get_feeds_trainer(feed_id) {
    const result = await browser.storage.local.get(
        ["local_feeds_trainers", "local_stories"]
    );

    if (feed_id in result.local_feeds_trainers) {
        return result.local_feeds_trainers[feed_id];
    }

    const stories = result.local_stories[feed_id];

    const milliseconds_per_month = 1000 * 60 * 60 * 24 * 30;
    const stories_last_month = stories.filter(s => Date.now() - s.story_timestamp * 1000 < milliseconds_per_month);

    const trainer = {
        classifiers: {
            feeds: {},
            authors: {},
            titles: {},
            tags: {},
        },
        feed_id: feed_id,
        stories_last_month: stories_last_month.length,
        num_subscribers: 1,
        feed_tags: [],
        feed_authors: [],
    };

    result.local_feeds_trainers[feed_id] = trainer;

    await browser.storage.local.set(
        {local_feeds_trainers: result.local_feeds_trainers}
    );

    return trainer;
}

export async function save_classifier(classifier_update) {
    const result = await browser.storage.local.get("local_feeds_trainers");

    const feed_id = classifier_update.feed_id;
    const trainer = result.local_feeds_trainers[feed_id];

    for (const update_key in classifier_update) {
        if (update_key === "feed_id") continue;

        // list of entities to update
        const update_ents = classifier_update[update_key];

        const update_key_split = update_key.split("_");

        // check whether we are adding or removign rules
        const remove = update_key_split[0] === "remove";

        // unpack update key
        // update_like is either "like" or "dislike". It says which one 
        // the update targets.
        // update_type is "author", "feed", "tag", or "title"
        if (remove) update_key_split.shift();
        const [update_like, update_type] = update_key_split;

        // In the trainer, likes or dislikes are represented by 1 or -1.
        const update_like_num = (update_like === "like") ? 1 : -1;

        // get the trainer object for this update_type
        // trainer_ents is an object of entities, with 
        // the entity as its key, and 1 or -1 for its value, 
        // to represent like or dislike.
        const trainer_classifier_key = update_type + "s";
        const trainer_ents = trainer.classifiers[trainer_classifier_key];

        // Either add or remove rules.
        if (remove) {
            for (const trainer_ent in trainer_ents) {
                if (update_ents.includes(trainer_ent)) {
                    delete trainer_ents[trainer_ent];
                }
            }
        } else {
            for (const update_ent of update_ents) {
                trainer_ents[update_ent] = update_like_num;
            }
        }
    }

    await browser.storage.local.set(result);
}

export async function get_local_feeds() {
    const result = await browser.storage.local.get("local_feeds");
    return result.local_feeds;
}

export async function setup_storage() {
    const result = await browser.storage.local.get([
        "local_feeds", 
        "local_stories", 
        "local_feeds_trainers",
        "next_feed_id",
    ]);

    browser.storage.local.set({
        local_feeds: result.local_feeds || {},
        local_stories: result.local_stories || {},
        local_feeds_trainers: result.local_feeds_trainers || {},
        next_feed_id: result.next_feed_id || -1,
    });
}
