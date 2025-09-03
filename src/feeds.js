import * as stories from "./stories.js";
import * as folders from "./folders.js";
import * as context_menu from "./feed_context_menu.js";
import * as storage from "./storage.js";
import { waitForElm } from "./utils.js";
import { parse_rss } from "./rss.js";

var local_feed_open = false;

export async function set_feed_focussed(feed_data, feed_view, focussed) {
    // set feed view class
    feed_view.classList.remove(focussed ? "unread_neutral" : "unread_positive");
    feed_view.classList.add(focussed ? "unread_positive" : "unread_neutral");

    // set count containerclass
    const unread_count_container = feed_view.querySelector(".feed_counts_floater").children[0];
    unread_count_container.classList.remove(focussed ? "unread_neutral" : "unread_positive");
    unread_count_container.classList.add(focussed ? "unread_positive" : "unread_neutral");

    // remove count type
    var unread_count = unread_count_container.querySelector(
        focussed ? ".unread_count_neutral" : ".unread_count_positive"
    );
    unread_count.classList.remove("unread_count_full");
    unread_count.classList.add("unread_count_empty");
    unread_count.innerHTML = "0";

    // add count type
    unread_count = unread_count_container.querySelector(
        focussed ? ".unread_count_positive" : ".unread_count_neutral"
    );
    unread_count.classList.remove("unread_count_empty");
    unread_count.classList.add("unread_count_full");
    const num_unread = await storage.get_num_unread(feed_data.attributes.id);
    unread_count.innerHTML = String(num_unread);

    // update storage
    feed_data.focussed = focussed;
    await storage.set_feed_focussed(feed_data.attributes.id, focussed);
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
    // delete from folders
    for (const folder_name of feed_data.folders) {
        if (new_folder_names.includes(folder_name)) continue;

        const folder_view = folders.get_folder_element(folder_name);
        const feed_view = get_feed_view(feed_data, folder_view);
        feed_view.remove();
    }

    // add to folders
    for (const folder_name of new_folder_names) {
        if (feed_data.folders.includes(folder_name)) continue;

        const folder_view = folders.get_folder_element(folder_name);
        add_feed_to_folder_view(feed_data, folder_view, folder_name);
    }

    // update storage
    storage.set_feed_folders(feed_data.attributes.id, new_folder_names);
}

export async function load_local_feeds() {
    const feed_data = await storage.get_local_feeds();

    for (const id in feed_data) {
        await add_feed_to_document(feed_data[id]);
    }
}

export async function add_feed_to_folder_view(feed_data, folder_view, folder_name) {
    const view = await create_feed_title_view(feed_data);

    /* add feed view to document */
    const folder_list = folder_view.querySelector(".folder");
    if (folder_name === "") {
        const first_child = folder_list.childNodes[0];
        folder_list.insertBefore(view, first_child);
    } else {
        folder_list.appendChild(view);
    }
}

export async function add_feed_to_document(feed_data) {
    for (var folder_name of feed_data.folders) {
        const folder_view = folders.get_folder_element(folder_name);
        await add_feed_to_folder_view(feed_data, folder_view, folder_name);
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
                    <span class="unread_count unread_count_neutral unread_count_empty">0</span>\
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

    set_feed_focussed(feed_data, view, feed_data.focussed);

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

export async function close_local_feed() {
    if (!local_feed_open) {
        return;
    }

    const taskbar = document.getElementById("story_taskbar");
    taskbar.style.display = "block";

    deselect_local_feed();

    local_feed_open = false;
}

export async function open_feed(feed_data, feed_view) {
    await open_split_view();

    const taskbar = document.getElementById("story_taskbar");
    taskbar.style.display = "none";

    const story_data = await storage.get_stories(feed_data.attributes.id);

    select_feed(feed_view);

    const story_titles = document.querySelector(".right-pane .NB-story-titles");
    while (story_titles.firstChild) story_titles.removeChild(story_titles.firstChild);
    for (const data of story_data) {
        const view = stories.create_story_view(data);
        story_titles.appendChild(view);
    }

    stories.open_story(story_data[0], story_titles.firstChild);

    local_feed_open = true;
}

export async function add_local_feed(rss_url, folder_name) {
    const rss_data = await parse_rss(rss_url);

    /* new feed data */
    const feed_attributes = {
        "id": await storage.get_new_feed_id(),
        "feed_title": rss_data.title,
        "feed_address": rss_url,
        "feed_link": rss_data.link,
        "favicon_url": rss_data.image_url,
    };

    folder_name = folder_name.split(":")[1].toLowerCase();

    const feed_data = {
        attributes: feed_attributes,
        folders: [folder_name],
        last_fetch: Date.now(),
    };
    await storage.add_local_feed_to_storage(feed_data);

    await storage.update_feed_stories(feed_data.attributes.id, rss_data.items);

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
    return local_feed_open;
}
