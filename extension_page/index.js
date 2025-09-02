import { import_all_data, export_all_data } from "../src/storage";

// import button
document.getElementById("import-button").onclick = async event => {
    const file_input = document.getElementById("file_input");
    file_input.addEventListener(
        "change",
        event => {
            // read file content
            const file = event.target.files[0]; 

            const reader = new FileReader();
            reader.readAsText(file);

            reader.onload = readerEvent => {
                // parse file content
                const json_data = readerEvent.target.result;
                const data = JSON.parse(json_data);
                console.log(data);
            }
        },
        { once: true},
    );

    // open file dialog
    file_input.click();
};

document.getElementById("export-button").onclick = async event => {
    // get data to export
    const data = JSON.stringify(await export_all_data());

    // create filename
    const now = new Date();
    const version = browser.runtime.getManifest().version;
    const filename = `newsblur_local_feeds_v${version}_export_${now.toISOString()}.json`;

    // download
    const download = document.createElement("a");
    download.setAttribute(
        "href", 
        "data:text/plan;charset=utf-8," + encodeURIComponent(data)
    );
    download.setAttribute("download", filename);
    download.click();
};
