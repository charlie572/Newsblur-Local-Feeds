export function create_feed(attributes, folders) {
    const feed = new NEWSBLUR.Models.Feed(attributes);

    /* 
     * In Newsblur, feed.folders doesn't seem to contain NEWSBLUR.Models.Folder
     * objects. It seems to contain the result of an AJAX request instead. I'm 
     * just going to use Folder objects though. I can't see how to construct
     * the proper objects.
     */
    feed.folders = folders.map(name => NEWSBLUR.assets.folders.find_folder(name));

    return feed;
}
