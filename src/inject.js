import js from "./insert_local_feeds.js"

async function parse_rss(url) {
    console.log("Fetching rss feed " + url);
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
    const image_url = xml.querySelector("url").textContent;

    const item_elements = xml.querySelectorAll("item");
    const items = [];
    for (const item of item_elements) {
        items.push({
            title: item.querySelector("title").textContent,
            description: item.querySelector("description").textContent,
            link: item.querySelector("link").textContent,
            pubDate: item.querySelector("pubDate").textContent,
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

const newsblur_origin = "https://www.newsblur.com";
window.addEventListener(
    "message",
    event => {
        if (
            event.origin === newsblur_origin
            && event.data.command === "parse_rss"
        ) {
            parse_rss(event.data.url)
            .then(rss => {
                event.source.postMessage(
                    {
                        command: "rss_result",
                        rss: rss,
                    }
                );
            });
        }
    }
);

var script = document.createElement("script");
script.innerText = js;
document.head.appendChild(script);
