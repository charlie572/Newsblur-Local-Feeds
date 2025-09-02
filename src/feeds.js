import * as stories from "./stories.js";
import * as folders from "./folders.js";
import * as context_menu from "./feed_context_menu.js";
import * as storage from "./storage.js";
import { waitForElm } from "./utils.js";
import { parse_rss } from "./rss.js";

export async function delete_feed(feed_data, feed_view, folder_name) {
    await storage.delete_feed_in_folder(feed_data.attributes.id, folder_name);
    feed_view.remove();
}

export function get_feed_view(feed_data, folder_view) {
    for (const feed of folder_view.querySelector(".folder").children) {
        if (feed.getAttribute("data-id") == feed_data.attributes.id) {
            return feed;
        }
    }

    throw new Error("Couldn't find feed view");
}

export async function move_folders(feed_data, new_folder_names) {
    for (const folder_name of feed_data.folders) {
        if (new_folder_names.includes(folder_name)) continue;

        const folder_view = folders.get_folder_element(folder_name);
        const feed_view = get_feed_view(feed_data, folder_view);
        await delete_feed(feed_data, feed_view, folder_name);
    }
}

export async function load_local_feeds() {
    const feed_data = await storage.get_local_feeds();

    for (const id in feed_data) {
        await add_feed_to_document(feed_data[id]);
    }
}

export async function add_feed_to_document(feed_data) {
    for (var folder_name of feed_data.folders) {
        const view = await create_feed_title_view(feed_data);

        /* add feed view to document */
        const folder = folders.get_folder_element(folder_name);
        const folder_list = folder.querySelector(".folder");
        if (folder_name === "") {
            const first_child = folder_list.childNodes[0];
            folder_list.insertBefore(view, first_child);
        } else {
            folder_list.appendChild(view);
        }
    }
}

export async function create_feed_title_view(feed_data) {
    const view = document.createElement("li");
    view.className = "feed unread_neutral NB-toplevel";
    view.setAttribute("data-id", feed_data.attributes.id);
    const num_unread = await storage.get_num_unread(feed_data.attributes.id);
    view.innerHTML = (
        `<div class="feed_counts">\
            <div class="feed_counts_floater">\
                <div class=" unread_neutral">\
                    <span class="unread_count unread_count_positive unread_count_empty">0</span>\
                    <span class="unread_count unread_count_neutral unread_count_full">${num_unread}</span>\
                    <span class="unread_count unread_count_negative unread_count_empty">0</span>\
                </div>\
            </div>\
        </div>\
        <img class="feed_favicon" src="${feed_data.attributes.favicon_url}">\
        <span class="feed_title">${feed_data.attributes.feed_title}</span>\
        <div class="NB-feed-exception-icon"></div>\
        <div class="NB-feed-unfetched-icon"></div>\
        <div class="NB-feedlist-manage-icon" role="button"></div>\
        <div class="NB-feed-highlight"></div>`
    );

    view.onclick = () => open_feed(feed_data, view);

    view.oncontextmenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        context_menu.open_feed_context_menu(view);
    };

    return view;
}

export function select_feed(feed_view) {
    const feed_list = document.getElementById("feed_list");
    const feeds = Array.from(feed_list.querySelectorAll(".feed"));
    for (const feed of feeds) {
        feed.classList.remove("selected");
        feed.classList.remove("NB-selected");
    }

    feed_view.classList.add("selected");
    feed_view.classList.add("NB-selected");
}

export function is_local_feed(feed_view) {
    return feed_view.getAttribute("data-id") < 0;
}

export function deselect_local_feed() {
    const feed_list = document.getElementById("feed_list");
    const feeds = Array.from(feed_list.querySelectorAll(".feed"));
    for (const feed of feeds) {
        if (is_local_feed(feed)) {
            feed.classList.remove("selected");
            feed.classList.remove("NB-selected");
        }
    }
}

export function get_non_local_feeds() {
    var feeds = Array.from(document.querySelectorAll("#feed_list .feed"));
    feeds = feeds.filter(feed => !is_local_feed(feed));
    return feeds;
}

export async function open_split_view() {
    // If the story list isn't open, click on a random feed to open it.
    var story = document.querySelector("#story_titles .NB-story-title-container");
    if (!story) {
        const non_local_feed = get_non_local_feeds()[0];
        non_local_feed.click();
        story = await waitForElm("#story_titles .NB-story-title-container");
    }

    // select split view
    document.querySelector(".NB-task-layout-split").click();

    // select feed view
    document.querySelector(".task_view_text").click();

    // The story view isn't open, open a random one.
    if (!document.querySelector(".NB-text-view .NB-feed-story")) {
        story.querySelector(".NB-story-title").click();
        await waitForElm(".NB-text-view .NB-feed-story");
    }
}

export async function open_feed(feed_data, feed_view) {
    await open_split_view();

    const story_data = await storage.get_stories(feed_data.attributes.id);

    select_feed(feed_view);

    const story_titles = document.querySelector(".right-pane .NB-story-titles");
    while (story_titles.firstChild) story_titles.removeChild(story_titles.firstChild);
    for (const data of story_data) {
        const view = stories.create_story_view(data);
        story_titles.appendChild(view);
    }

    stories.open_story(story_data[0], story_titles.firstChild);
}

export async function add_local_feed(rss_url, folder_name) {
    const rss_data = await parse_rss(rss_url);

    /* new feed data */
    const feed_attributes = {
        "id": await storage.get_new_feed_id(),
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

    const feed_data = {
        attributes: feed_attributes,
        folders: [folder_name],
    };
    await storage.add_local_feed_to_storage(feed_data);

    add_feed_to_document(feed_data);
}

export function bind_feed_clicks(func) {
    const feed_list = document.getElementById("feed_list");
    const feeds = Array.from(feed_list.querySelectorAll(".feed"));
    for (const feed of feeds) {
        feed.onclick = func;
    }
}

export function get_selected_feed_view() {
    return document.querySelector("#feed_list .feed.selected");
}

export function is_local_feed_open() {
    const feed = get_selected_feed_view();
    return is_local_feed(feed);
}
