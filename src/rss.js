export async function parse_rss(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const text = await response.text();

    const parser = new window.DOMParser();
    const xml = parser.parseFromString(text, "text/xml");

    const title = xml.querySelector("title").textContent;
    const link = xml.querySelector("link").textContent;
    const description = xml.querySelector("description").textContent;

    var image_url = null;
    const image_element = xml.querySelector("image url");
    if (image_element) {
        image_url = image_element.textContent;
    }

    const item_elements = xml.querySelectorAll("item");
    const items = [];
    for (const item of item_elements) {
        /* get categories */
        var categories = Array.from(item.querySelectorAll("category"));
        categories = categories.map(cat => cat.textContent);

        /* get content */
        var content = null;
        const content_element = item.getElementsByTagName("content:encoded");
        if (content_element) {
            content = content_element.textContent;
        }

        items.push({
            title: item.querySelector("title").textContent,
            description: item.querySelector("description").textContent,
            link: item.querySelector("link").textContent,
            pubDate: new Date(item.querySelector("pubDate").textContent),
            author: item.querySelector("author").textContent,
            categories: categories,
            content: content,
        });
    }

    return {
        title: title,
        link: link,
        description: description,
        image_url: image_url,
        items: items,
    };
}
