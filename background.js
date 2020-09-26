"use strict";

console.log("APE [background.js] starting");

//Users Azure auth token
var authToken;

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (info) {
        if (info.url.indexOf("portal.azure.com") === -1) {
            for (let header of info.requestHeaders) {
                if (header.name.toLowerCase() === "authorization") {
                    if (authToken == null || authToken !== header.value) {
                        authToken = header.value;
                        console.log("APE authtoken updated");
                    }
                }
            }
        }
        return {requestHeaders: info.requestHeaders};
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);