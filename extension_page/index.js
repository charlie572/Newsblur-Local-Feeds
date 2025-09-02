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

// document.getElementById("export-button").onclick = event => {
// };
