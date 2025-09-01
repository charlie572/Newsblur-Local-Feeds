import * as storage from "./storage.js";

export function create_story_view(story_data) {
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

export function open_story(story_data, story_list_view) {
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

export function mark_story_read(story_data, story_view) {
    story_data.attributes.read_status = 1;
    storage.set_story(story_data);
    story_view.querySelector(".NB-story-title").classList.add("read");
}

export function mark_story_unread(story_data, story_view) {
    story_data.attributes.read_status = 0;
    storage.set_story(story_data);
    story_view.querySelector(".NB-story-title").classList.remove("read");
}

export function toggle_story_read(story_data, story_view) {
    if (story_data.attributes.read_status) {
        mark_story_unread(story_data, story_view);
    } else {
        mark_story_read(story_data, story_view);
    }
}

export function select_story(story_view) {
    const story_list = document.getElementById("story_titles");
    const stories = Array.from(story_list.querySelectorAll(".NB-story-title-container"));
    for (const story of stories) {
        story.classList.remove("NB-selected");
        story.querySelector(".NB-story-title").classList.remove("NB-selected");
    }

    story_view.classList.add("NB-selected");
    story_view.querySelector(".NB-story-title").classList.add("NB-selected");
}

export function get_selected_story_view() {
    return document.querySelector("#story_titles .NB-story-title-container.NB-selected");
}

export function get_next_story_view() {
    const current_story = get_selected_story_view();
    const stories = Array.from(current_story.parentNode.childNodes)
    const current_index = stories.indexOf(current_story);
    if (current_index < stories.length - 1) {
        return stories[current_index + 1];
    } else {
        return null;
    }
}

export function get_previous_story_view() {
    const current_story = get_selected_story_view();
    const stories = Array.from(current_story.parentNode.childNodes)
    const current_index = stories.indexOf(current_story);
    if (current_index > 0) {
        return stories[current_index - 1];
    } else {
        return null;
    }
}
