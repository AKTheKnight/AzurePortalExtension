
function logBackground(message) {
    log("background.js", message);
}

function logScript(message) {
    log("script.js", message);
}

function log(file, message) {
    console.log("APE [" + file + "] " + message);
}