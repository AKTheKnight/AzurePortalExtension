//"use strict";

logBackground("starting")
//console.log("APE [background.js] starting");

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request !== "getSubscriptions") {
        return false;
    }

    getSubscriptions().then(sendResponse);
    return true; // return true to indicate you want to send a response asynchronously
});

async function getSubscriptions() {
    let subscriptions = [];

    subscriptions = await jQuery.ajax({
        type: 'GET',
        headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
        },
        url: "https://management.azure.com/subscriptions?api-version=2014-04-01-preview",
    }).then( response => {
        let subs = []
        for (let i = 0; i < response.value.length; i++) {
            let sub = response.value[i];

            let subscription = {
                name: sub.displayName,
                id: sub.subscriptionId,
                resourceGroups: []
            }
            subs.push(subscription);
        }
        return subs;
    });

    subscriptions = await Promise.all(subscriptions.map((subscription) => {
        return jQuery.ajax({
            type: 'GET',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            url: 'https://management.azure.com/subscriptions/'
                + subscription.id
                + '/resourcegroups'
                + '?api-version=2019-08-01',
        }).then( response2 => {
            for (let j = 0; j < response2.value.length; j++) {
                let rg = response2.value[j];

                let resourceGroup = {
                    name: rg.name,
                    resources: []
                }

                subscription.resourceGroups.push(resourceGroup);
            }
            return subscription;
        });
    }));

    subscriptions = await Promise.all(subscriptions.map(async (subscription) => {

        subscription.resourceGroups = await Promise.all(subscription.resourceGroups.map((resourceGroup) => {
            return jQuery.ajax({
                type: 'GET',
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                },
                url: 'https://management.azure.com/subscriptions/'
                    + subscription.id
                    + '/resourcegroups/'
                    + resourceGroup.name
                    + "/resources"
                    + '?api-version=2019-08-01',
            }).then( response3 => {
                for (let k = 0; k < response3.value.length; k++) {
                    let res = response3.value[k];

                    let resource = {
                        name: res.name,
                        type: res.type
                    }
                    if (res.type === "Microsoft.Web/sites") {
                        resource.url = "https://" + res.name + ".azurewebsites.net";
                    }
                    resourceGroup.resources.push(resource);
                }
                return resourceGroup;
            });
        }));

        return subscription;
    }));

    console.log("About to return");
    console.log(subscriptions);

    return {subscriptions: subscriptions};
}