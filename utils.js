const IS_DEV_MODE = !('update_url' in chrome.runtime.getManifest());

function logBackground(message) {
    log("background.js", message);
}

function logScript(message) {
    log("script.js", message);
}

function log(file, message) {
    if (IS_DEV_MODE) {
        console.log("APE [" + file + "] " + message);
    }
}

// https://j11y.io/javascript/regex-selector-for-jquery/
// Permission given to Alex via Twitter for use.
jQuery.expr[':'].regex = function(elem, index, match) {
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ?
                matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'ig',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
}