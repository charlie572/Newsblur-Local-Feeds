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
    // const feed_data = await storage.get_local_feeds();

    const feed_data = {
        "-1": {
            attributes: {}, 
            folders: ["Art"],
        },
    };

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
        '<div class="feed_counts">\
            <div class="feed_counts_floater">\
                <div class=" unread_positive">\
                    <span class="unread_count unread_count_positive unread_count_full">1</span>\
                    <span class="unread_count unread_count_neutral unread_count_empty">0</span>\
                    <span class="unread_count unread_count_negative unread_count_empty">0</span>\
                </div>\
            </div>\
        </div>\
        <img class="feed_favicon" src="https://s3.amazonaws.com/icons.newsblur.com/8971696.png">\
        <span class="feed_title">3Blue1Brown mailing list</span>\
        <div class="NB-feed-exception-icon"></div>\
        <div class="NB-feed-unfetched-icon"></div>\
        <div class="NB-feedlist-manage-icon" role="button"></div>\
        <div class="NB-feed-highlight"></div>'
    );

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

function add_local_feed(url, folder) {
}

async function main() {
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
