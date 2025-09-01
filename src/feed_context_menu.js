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
}
