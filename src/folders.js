export function get_folder_element(folder_name) {
    if (folder_name === "") {
        return document.querySelector(".NB-root").parentElement;
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

export function get_feed_view_folder_name(feed_view) {
    var folder = feed_view.parentNode;
    if (folder.classList.contains("NB-root")) {
        return "";
    }

    folder = feed_view.parentNode.parentNode;
    return folder.querySelector(".folder_title").innerText.toLowerCase();
}
