async function import_newsblur_scripts() {
    const setup_script = document.head.querySelector("script");
    const setup_js = setup_script.innerText;

    const response = await fetch("https://www.newsblur.com/static/js/common.8b480b7f0cea.js");
    if (!response.ok) {
        throw new Error("Failed to get newsblur javascript");
    }
    const common_js = await response.text();

    eval(setup_js);
    eval(common_js);

    console.log(NEWSBLUR);
}

import_newsblur_scripts();

function add_feed_to_document(feed) {
    for (var folder of feed.folders) {
        /* check if this folder is the root folder */
        const root = "options" in folder;

        /* create feed view */
        const view = new NEWSBLUR.Views.FeedTitleView({
            model: feed,
            type: 'feed',
            depth: root ? 0 : folder.folder_view.options.depth,
            folder_title: root ? "" : folder.get("folder_title"),
            folder: folder,
        }).render();
        feed.views.push(view);

        /* add feed view to document */
        if (root) {
            const parent_element = document.querySelector(".NB-root");
            const first_child = parent_element.childNodes[0];
            parent_element.insertBefore(view.el, first_child);
        } else {
            const parent_element = folder.folder_view.el.querySelector(".folder");
            parent_element.appendChild(view.el);
        }
    }
}
