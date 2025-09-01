import * as storage from "./storage.js";
import * as feeds from "./feeds.js";
import * as stories from "./stories.js";

async function process_keydown(event) {
    if (!feeds.is_local_feed_open()) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.key === "j") {
        const story_view = stories.get_next_story_view();
        const story_data = await storage.get_story_by_hash(story_view.getAttribute("story-hash"));
        if (story_view) {
            stories.open_story(story_data, story_view)
        }
    } else if (event.key === "k") {
        const story_view = stories.get_previous_story_view();
        const story_data = await storage.get_story_by_hash(story_view.getAttribute("story-hash"));
        if (story_view) {
            stories.open_story(story_data, story_view)
        }
    } else if (event.key === "m" || event.key === "u") {
        const story_view = stories.get_selected_story_view()
        const story_data = await storage.get_story_by_hash(story_view.getAttribute("story-hash"));
        stories.toggle_story_read(story_data, story_view);
    }
}

async function main() {
    await storage.setup_storage();
    feeds.bind_feed_clicks((feed) => feeds.deselect_local_feed());
    await feeds.load_local_feeds();

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
        button.onclick = () => feeds.add_local_feed(url.value, folder.value);

        const add_site_group = popup.querySelector(".NB-add-site");
        add_site_group.appendChild(button);
    }, 500);

    document.addEventListener("keydown", process_keydown, {capture: true});
}
setTimeout(main, 2000);
