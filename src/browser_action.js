// open the extension page when the extension icon is clicked
browser.browserAction.onClicked.addListener(event => {
    const page_url = browser.runtime.getURL("extension_page/index.html");
    browser.tabs.create({
        active: true,
        url: page_url,
    });
    window.open(page_url, "mozillaTab");
});