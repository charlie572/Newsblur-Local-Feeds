import { import_all_data, export_all_data } from "../src/storage";

const file_output = document.getElementById("file-output");
const clear_output = document.getElementById("clear-output");

// import button
document.getElementById("import-button").onclick = async event => {
    clear_output.innerHTML = "";
    file_output.innerHTML = "";

    const file_input = document.getElementById("file_input");
    file_input.addEventListener(
        "change",
        event => {
            // read file content
            const file = event.target.files[0]; 

            const reader = new FileReader();
            reader.readAsText(file);

            reader.onload = async readerEvent => {
                // parse file content
                const json_data = readerEvent.target.result;
                const data = JSON.parse(json_data);
                
                const message = await import_all_data(data);

                file_output.innerHTML = message;
            }
        },
        { once: true },
    );

    // open file dialog
    file_input.click();
};

// export button
document.getElementById("export-button").onclick = async event => {
    clear_output.innerHTML = "";
    file_output.innerHTML = "";

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

// clearing all data
const clear_button = document.getElementById("clear-button");
const clear_confirm_button = document.getElementById("clear-confirm-button");
const clear_cancel_button = document.getElementById("clear-cancel-button");

clear_button.onclick = event => {
    clear_output.innerHTML = "";
    file_output.innerHTML = "";

    clear_button.style.display = "none";
    clear_confirm_button.style.display = "block";
    clear_cancel_button.style.display = "block";
}

clear_cancel_button.onclick = event => {
    clear_output.innerHTML = "";
    file_output.innerHTML = "";

    clear_button.style.display = "block";
    clear_confirm_button.style.display = "none";
    clear_cancel_button.style.display = "none";
}

clear_confirm_button.onclick = async event => {
    clear_output.innerHTML = "";
    file_output.innerHTML = "";

    await browser.storage.local.clear();

    clear_button.style.display = "block";
    clear_confirm_button.style.display = "none";
    clear_cancel_button.style.display = "none";

    clear_output.innerHTML = "Deleted all data.";
}
