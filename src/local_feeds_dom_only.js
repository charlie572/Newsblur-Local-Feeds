import { parse_rss } from "./rss.js";
import * as storage from "./storage.js";
import { waitForElm } from "./utils.js";

async function load_local_feeds() {
    const feed_data = await storage.get_local_feeds();

    for (const id in feed_data) {
        await add_feed_to_document(feed_data[id]);
    }
}

async function add_feed_to_document(feed_data) {
    for (var folder_name of feed_data.folders) {
        const view = await create_feed_title_view(feed_data);

        /* add feed view to document */
        const folder = get_folder_element(folder_name);
        if (folder_name === "") {
            const first_child = folder.childNodes[0];
            folder.insertBefore(view, first_child);
        } else {
            folder.querySelector(".folder").appendChild(view);
        }
    }
}

async function create_feed_title_view(feed_data) {
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
        open_feed_context_menu(view);
    };

    return view;
}

function get_folder_element(folder_name) {
    if (folder_name === "") {
        return document.querySelector(".NB-root");
    }

    const folders = Array.from(document.querySelectorAll(".NB-root .NB-folder"));
    for (const folder of folders) {
        const title_element = folder.querySelector(".folder_title");
        if (title_element && title_element.innerText.toLowerCase() === folder_name.toLowerCase()) {
            return folder;
        }
    }

    throw new Error("Couldn't find folder")
}

function create_story_view(story_data) {
    const attrs = story_data.attributes;

    const date = new Date(attrs.story_timestamp * 1000)
    const date_string = date.toLocaleString();

    const view = document.createElement("div");
    view.className = "NB-story-title-container";
    view.setAttribute("story-hash", story_data.attributes.story_hash);
    view.innerHTML = (
        `<div class="NB-story-title NB-story-title-split NB-has-image NB-story-positive ${attrs.read_status ? 'read' : ''}">\
            <div class="NB-storytitles-feed-border-inner" style="background-color: rgb(159, 120, 84);"></div>\
            <div class="NB-storytitles-feed-border-outer" style="background-color: rgb(129, 90, 54);"></div>\
            <div class="story_title NB-hidden-fade">\
                <div class="NB-storytitles-sentiment" role="button"></div>\
                <div class="NB-story-manage-icon" role="button"></div>\
                <div class="NB-storytitles-story-image-container"></div>\
                <div class="NB-storytitles-star"></div>\
                <div class="NB-storytitles-share"></div>\
                <span class="NB-storytitles-title">${attrs.story_title}</span>\
                <div class="NB-storytitles-content-preview"></div>\
                <div class="NB-story-title-split-bottom">\
                    <span class="story_date NB-hidden-fade">${date_string}</span>\
                    <span class="NB-middot">·</span>\
                    <span class="NB-storytitles-author">${attrs.story_authors}</span>\
                </div>\
            </div>\
        </div>\
        <div class="NB-story-detail"></div>`
    );

    view.onclick = () => open_story(story_data, view);

    return view;
}

function open_feed_context_menu(feed_view) {
    const feed_rect = feed_view.getBoundingClientRect();

    const menu = document.querySelector(".NB-menu-manage-container");
    menu.className = "NB-menu-manage-container NB-inverse";
    menu.style.display = "block";
    menu.style.opacity = "1";
    menu.style.position = "absolute";
    menu.style.inset = `${feed_rect.top}px auto auto ${feed_rect.left}px`;
    menu.innerHTML = (
        '<ul class="NB-menu-manage NB-menu-manage-feed">\
            <li role="button" class="NB-menu-item NB-menu-manage-delete-confirm NB-menu-manage-feed-delete-confirm">\
                <div class="NB-menu-manage-image"></div>\
                <div class="NB-menu-manage-title">Really delete?</div>\
            </li>\
            <li role="button" class="NB-menu-item NB-menu-manage-delete NB-menu-manage-feed-delete">\
                <div class="NB-menu-manage-image"></div>\
                <div class="NB-menu-manage-title">Delete this site</div>\
            </li>\
            <li role="button" class="NB-menu-subitem NB-menu-manage-confirm NB-menu-manage-feed-move-confirm NB-modal-submit">\
                <div class="NB-menu-manage-confirm-position">\
                    <div class="NB-change-folders"></div>\
                </div>\
            </li>\
            <li role="button" class="NB-menu-item NB-menu-manage-move NB-menu-manage-feed-move">\
                <div class="NB-menu-manage-move-save NB-menu-manage-feed-move-save NB-modal-submit-green NB-modal-submit-button">Save</div>\
                <div class="NB-menu-manage-image"></div>\
                <div class="NB-menu-manage-title">Change folders</div>\
            </li>\
            <li class="NB-menu-separator-inverse"></li>\
        </ul>\
        <div class="NB-menu-manage-arrow" style="border-radius: 0px 0px 5px 5px;">\
            <div class="NB-icon"></div>\
        </div>'
    );

    // close when clicked outside the context menu
    const click_event = (event) => {
        if (!menu.contains(event.target)) {
            menu.style.display = "none";
            document.removeEventListener("click", click_event);
        }
    }
    document.addEventListener("click", click_event);
}

function open_story(story_data, story_list_view) {
    select_story(story_list_view);

    const attrs = story_data.attributes;

    const title = document.querySelector(".NB-feed-story .NB-feed-story-header-title");
    title.innerText = "";

    const icon = document.querySelector(".NB-feed-story .NB-feed-story-feed .feed_favicon");
    icon.src = attrs.favicon_url;

    const story_title = document.querySelector(".NB-text-view .NB-feed-story .NB-feed-story-header .NB-feed-story-title");
    story_title.href = attrs.story_permalink;
    story_title.innerText = attrs.story_title;

    const date_view = document.querySelector(".NB-text-view .NB-feed-story .NB-feed-story-date");
    const date = new Date(attrs.story_timestamp * 1000)
    const date_string = date.toLocaleString();
    date.innerText = date_string;

    const author = document.querySelector(".NB-text-view .NB-feed-story .NB-feed-story-author");
    author.innerText = attrs.story_authors;

    const content = document.querySelector(".NB-text-view .NB-feed-story .NB-feed-story-content");
    content.innerHTML = attrs.story_content || "";
}

function mark_story_read(story_data, story_view) {
    story_data.attributes.read_status = 1;
    storage.set_story(story_data);
    story_view.querySelector(".NB-story-title").classList.add("read");
}

function mark_story_unread(story_data, story_view) {
    story_data.attributes.read_status = 0;
    storage.set_story(story_data);
    story_view.querySelector(".NB-story-title").classList.remove("read");
}

function toggle_story_read(story_data, story_view) {
    if (story_data.attributes.read_status) {
        mark_story_unread(story_data, story_view);
    } else {
        mark_story_read(story_data, story_view);
    }
}

function select_feed(feed_view) {
    const feed_list = document.getElementById("feed_list");
    const feeds = Array.from(feed_list.querySelectorAll(".feed"));
    for (const feed of feeds) {
        feed.classList.remove("selected");
        feed.classList.remove("NB-selected");
    }

    feed_view.classList.add("selected");
    feed_view.classList.add("NB-selected");
}

function select_story(story_view) {
    const story_list = document.getElementById("story_titles");
    const stories = Array.from(story_list.querySelectorAll(".NB-story-title-container"));
    for (const story of stories) {
        story.classList.remove("NB-selected");
        story.querySelector(".NB-story-title").classList.remove("NB-selected");
    }

    story_view.classList.add("NB-selected");
    story_view.querySelector(".NB-story-title").classList.add("NB-selected");
}

function is_local_feed(feed_view) {
    return feed_view.getAttribute("data-id") < 0;
}

function deselect_local_feed() {
    const feed_list = document.getElementById("feed_list");
    const feeds = Array.from(feed_list.querySelectorAll(".feed"));
    for (const feed of feeds) {
        if (is_local_feed(feed)) {
            feed.classList.remove("selected");
            feed.classList.remove("NB-selected");
        }
    }
}

function get_non_local_feeds() {
    var feeds = Array.from(document.querySelectorAll("#feed_list .feed"));
    feeds = feeds.filter(feed => !is_local_feed(feed));
    return feeds;
}

async function open_split_view() {
    // If the story list isn't open, click on a random feed to open it.
    var story = document.querySelector("#story_titles .NB-story-title-container");
    if (!story) {
        const non_local_feed = get_non_local_feeds()[0];
        console.log("Non local feed", non_local_feed);
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

async function open_feed(feed_data, feed_view) {
    await open_split_view();

    const stories = await storage.get_stories(feed_data.attributes.id);

    select_feed(feed_view);

    const story_titles = document.querySelector(".right-pane .NB-story-titles");
    while (story_titles.firstChild) story_titles.removeChild(story_titles.firstChild);
    for (const story_data of stories) {
        const view = create_story_view(story_data);
        story_titles.appendChild(view);
    }

    open_story(stories[0], story_titles.firstChild);
}

async function add_local_feed(rss_url, folder_name) {
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

    await storage.add_local_feed_to_storage({
        attributes: feed_attributes,
        folders: [folder_name],
    });

    await load_local_feeds();
}

function bind_feed_clicks(func) {
    const feed_list = document.getElementById("feed_list");
    const feeds = Array.from(feed_list.querySelectorAll(".feed"));
    for (const feed of feeds) {
        feed.onclick = func;
    }
}

function get_selected_feed_view() {
    return document.querySelector("#feed_list .feed.selected");
}

function get_selected_story_view() {
    return document.querySelector("#story_titles .NB-story-title-container.NB-selected");
}

function is_local_feed_open() {
    const feed = get_selected_feed_view();
    return is_local_feed(feed);
}

function get_next_story_view() {
    const current_story = get_selected_story_view();
    const stories = Array.from(current_story.parentNode.childNodes)
    const current_index = stories.indexOf(current_story);
    if (current_index < stories.length - 1) {
        return stories[current_index + 1];
    } else {
        return null;
    }
}

function get_previous_story_view() {
    const current_story = get_selected_story_view();
    const stories = Array.from(current_story.parentNode.childNodes)
    const current_index = stories.indexOf(current_story);
    if (current_index > 0) {
        return stories[current_index - 1];
    } else {
        return null;
    }
}

async function process_keydown(event) {
    if (!is_local_feed_open()) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "j") {
        const story_view = get_next_story_view();
        const story_data = await storage.get_story_by_hash(story_view.getAttribute("story-hash"));
        if (story_view) {
            open_story(story_data, story_view)
        }
    } else if (event.key === "k") {
        const story_view = get_previous_story_view();
        const story_data = await storage.get_story_by_hash(story_view.getAttribute("story-hash"));
        if (story_view) {
            open_story(story_data, story_view)
        }
    } else if (event.key === "m" || event.key === "u") {
        const story_view = get_selected_story_view()
        const story_data = await storage.get_story_by_hash(story_view.getAttribute("story-hash"));
        toggle_story_read(story_data, story_view);
    }
}

async function main() {
    await storage.setup_storage();
    bind_feed_clicks((feed) => deselect_local_feed());
    await load_local_feeds();

    const add_button = document.querySelector(".NB-task-add");
    add_button.onclick = () => setTimeout(() => {
        const popup = document.querySelector(".NB-add-popover");

        const button = document.createElement("div");
        button.className = "NB-modal-submit-button NB-modal-submit-green";
        button.innerText = "Add local site";
        button.style.float = "right";
        button.style.margin = "6px 0 6px 0";

        const url = popup.querySelector(".NB-add-url");
        const folder = popup.querySelector(".NB-folders");
        button.onclick = () => add_local_feed(url.value, folder.value);

        const add_site_group = popup.querySelector(".NB-add-site");
        add_site_group.appendChild(button);
    }, 500);

    document.addEventListener("keydown", process_keydown, {capture: true});
}
setTimeout(main, 2000);
