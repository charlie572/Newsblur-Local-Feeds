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
        open_folder_selector(menu);
    };
}

function open_folder_selector(menu) {
    const selector_item = document.querySelector(".NB-menu-subitem.NB-menu-manage-confirm");
    selector_item.style.height = "84px";
    selector_item.style.display = "block";

    const folders = selector_item.querySelector(".NB-change-folders");
    folders.innerHTML = (
        '<div style="padding-left: 0px;" class="NB-folder-option NB-folder-option-active">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Top Level</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Art</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Entertainment</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">News</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Science</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Technology</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">To-read/watch</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Uncategorized</div>\
        </div>\
        <div style="padding-left: 12px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Videos</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Animation</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Art Videos</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Comedy</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Computers</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Gaming</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Maker</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Maths</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Music</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Other Eductional</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Science Videos</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Spanish</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Storytelling Video Essays</div>\
        </div>\
        <div style="padding-left: 24px;" class="NB-folder-option ">\
            <div class="NB-icon-add"></div>\
            <div class="NB-icon"></div>\
            <div class="NB-folder-option-title">Vlogs</div>\
        </div>'
    );
}