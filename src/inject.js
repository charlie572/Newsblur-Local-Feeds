import js from "./insert_local_feeds.js"

async function parse_rss(url) {
    console.log("Fetching rss feed " + url);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const text = await response.text();

    return text;
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
            .then(text => {
                event.source.postMessage(
                    {
                        command: "rss_result",
                        text: text,
                    }
                );
            });
        }
    }
);

var script = document.createElement("script");
script.innerText = js;
document.head.appendChild(script);
