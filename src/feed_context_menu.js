import * as storage from "./storage.js";

export async function open_feed_context_menu(feed_view) {
    const feed_data = await storage.get_feed_from_storage(feed_view.getAttribute("data-id"));

    const feed_rect = feed_view.getBoundingClientRect();

    const menu = document.querySelector(".NB-menu-manage-container");
    menu.className = "NB-menu-manage-container NB-inverse";
    menu.style.display = "block";
    menu.style.opacity = "1";
    menu.style.position = "absolute";
    menu.style.inset = `${feed_rect.top}px auto auto ${feed_rect.left}px`;
    menu.innerHTML = (
        '<ul class="NB-menu-manage NB-menu-manage-feed">\
            <li role="button" class="NB-menu-item NB-menu-manage-delete">\
                <div class="NB-menu-manage-image"></div>\
                <div class="NB-menu-manage-title">Delete this site</div>\
            </li>\
            <li role="button" class="NB-menu-subitem NB-menu-manage-confirm NB-modal-submit">\
                <div class="NB-menu-manage-confirm-position">\
                    <div class="NB-change-folders"></div>\
                </div>\
            </li>\
            <li role="button" class="NB-menu-item">\
                <div class="NB-menu-manage-move-save NB-modal-submit-green NB-modal-submit-button">Save</div>\
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

    // delete
    const delete_button = menu.querySelector(".NB-menu-manage-delete");
    delete_button.onclick = (event) => {
        delete_feed(feed_data, feed_view);
        menu.style.display = "none";
        document.removeEventListener("click", click_event);
    }

    // move
    const move_button = menu.querySelector(".NB-menu-manage-move-save").parentNode;
    move_button.onclick = (event) => {
        open_folder_selector(menu, feed_data);
    };
}

function get_folder_hierarchy(root) {
    if (!root) {
        root = document.getElementById("feed_list").querySelector(".NB-root");
    }

    const result = [];

    for (const element of root.children) {
        if (element.classList.contains("NB-empty")) continue;

        if (element.classList.contains("feed")) {
            result.push(element.getAttribute("data-id"));
        } else {
            const folder = element.querySelector(".folder");
            const children = get_folder_hierarchy(folder);
            const title = element.querySelector(".folder_title").innerText;
            result.push({folder_title: title, children: children});
        }
    }

    return result;
}

function create_folder_selector_option(folder_name, depth) {
    const option = document.createElement("div");
    option.style["padding-left"] = `${depth * 12}px`;
    option.innerHTML = (
        `<div class="NB-icon-add"></div>\
        <div class="NB-icon"></div>\
        <div class="NB-folder-option-title">${folder_name}</div>`
    );

    option.onclick = (event) => {
        // toggle selected
        const title = option.querySelector(".NB-folder-option-title");
        if (option.classList.contains("NB-folder-option-active")) {
            option.classList.remove("NB-folder-option-active");
            title.style["font-weight"] = "normal";
        } else {
            option.classList.add("NB-folder-option-active");
            title.style["font-weight"] = "bold";
        }
    }

    return option
}

function create_folder_selector_hierarchy(folder_hierarchy, parent, depth) {
    depth = depth || 0;

    if (depth == 0) {
        parent.appendChild(
            create_folder_selector_option("Top Level", 0)
        );
        depth += 1;
    }

    for (const item of folder_hierarchy) {
        if (typeof item === "string") continue;

        parent.appendChild(
            create_folder_selector_option(item.folder_title, depth)
        );

        create_folder_selector_hierarchy(item.children, parent, depth + 1);
    }
}

function select_folders_in_selector(folder_names) {
    const container = document.querySelector(".NB-change-folders");

    for (var folder_name of folder_names) {
        if (folder_name === "") {
            folder_name = "Top Level";
        }

        const result = document.evaluate(
            '//div[*[@class="NB-folder-option-title"]]', 
            container, 
            null, 
            XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
        );
        
        var option;
        while (option = result.iterateNext()) {
            if (option.innerText.toLowerCase() === folder_name.toLowerCase()) {
                const title = option.querySelector(".NB-folder-option-title");
                option.classList.add("NB-folder-option-active");
                title.style["font-weight"] = "bold";
                break;
            }
        }
    }
}

function open_folder_selector(menu, feed_data) {
    const selector_item = document.querySelector(".NB-menu-subitem.NB-menu-manage-confirm");
    selector_item.style.height = "84px";
    selector_item.style.display = "block";

    const folder_container = selector_item.querySelector(".NB-change-folders");
    const hierarchy = get_folder_hierarchy()
    create_folder_selector_hierarchy(hierarchy, folder_container);

    select_folders_in_selector(feed_data.folders);
}