import { parse_rss } from "./rss.js";
import * as storage from "./storage.js";

// import { NEWSBLUR } from "./setup_env.js";
// import "../repos/NewsBlur/media/js/newsblur/models/feeds.js";


// async function import_newsblur_scripts() {
//     const setup_script = document.head.querySelector("script");
//     const setup_js = setup_script.innerText;

//     const response = await fetch("https://www.newsblur.com/static/js/common.8b480b7f0cea.js");
//     if (!response.ok) {
//         throw new Error("Failed to get newsblur javascript");
//     }
//     const common_js = await response.text();

//     eval(setup_js);
//     eval(common_js);

//     console.log(NEWSBLUR);
// }

// import_newsblur_scripts();

async function load_local_feeds() {
    const feed_data = await storage.get_local_feeds();

    for (const id in feed_data) {
        add_feed_to_document(feed_data[id]);
    }
}

function add_feed_to_document(feed_data) {
    for (var folder_name of feed_data.folders) {
        const view = create_feed_title_view(feed_data);

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

function create_feed_title_view(feed_data) {
    const view = document.createElement("li");
    view.className = "feed unread_positive NB-toplevel";
    view.innerHTML = (
        `<div class="feed_counts">\
            <div class="feed_counts_floater">\
                <div class=" unread_positive">\
                    <span class="unread_count unread_count_positive unread_count_full">1</span>\
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

    view.onclick = () => open_feed(feed_data);

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
    view.innerHTML = (
        `<div class="NB-story-title NB-story-title-split NB-has-image NB-story-positive">\
            <div class="NB-storytitles-feed-border-inner" style="background-color: rgb(159, 120, 84);"></div>\
            <div class="NB-storytitles-feed-border-outer" style="background-color: rgb(129, 90, 54);"></div>\
            <a href="${attrs.story_permalink}" class="story_title NB-hidden-fade">\
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
            </a>\
        </div>\
        <div class="NB-story-detail"></div>`
    );

    view.onclick = () => open_story(story_data);

    return view;
}

function open_story(story_data) {
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

async function open_feed(feed_data) {
    // const formatted_title = feed_data.attributes.feed_title.toLowerCase().replace(" ", "-");
    // const url = `https://www.newsblur.com/site/${feed_data.attributes.id}/${formatted_title}`
    // window.location.replace(url);

    const stories = await storage.get_stories(feed_data.attributes.id);

    document.body.classList.add("NB-show-reader");

    const story_titles = document.querySelector(".right-pane .NB-story-titles");
    while (story_titles.firstChild) story_titles.removeChild(story_titles.firstChild);
    for (const story_data of stories) {
        const view = create_story_view(story_data);
        story_titles.appendChild(view);
    }
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

async function main() {
    await storage.setup_storage();
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
}
setTimeout(main, 2000);
