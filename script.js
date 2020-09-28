'use strict';

logScript("starting");


function updatePortal() {
    //All updates start in this thread
    if (isUrlShowingResourceGroups(window.location.href) === true) {
        updateResourceGroupList();
    }

    //Update every second
    setTimeout(updatePortal, 1000);
}

function updateData() {
    chrome.runtime.sendMessage("getSubscriptions", function(response) {
        logScript("sending getSubscriptions");
        //console.log("APE [script.js] sending getSubscriptions");
        subscriptions = response.subscriptions;
        console.log(subscriptions);
    });

    // Updating every 5 seconds as it might take a while with large accounts
    //setTimeout(updateData, 5000);
}

setTimeout(updateData, 1000);
updatePortal();

var subscriptions = []

function getSubscriptionFromName(name) {
    return subscriptions.find((sub) => sub.name === name);
}

function getSubscriptionFromId(id) {
    return subscriptions.find((sub) => sub.id === id);
}

function getResourceGroup(name, subscription) {
    return subscription.resourceGroups.find((rg) => rg.name === name);
}

function getAllResourcesFromSubscription(subscription) {
    let resources = [];
    for (let resourceGroup of subscription.resourceGroups) {
        resources.concat(resourceGroup.resources);
    }

    return resources;
}

function getWebAppsFromSubscription(subscription) {
    let webApps = [];
    for (let resourceGroup of subscription.resourceGroups) {
        webApps = webApps.concat(getWebAppsFromResourceGroup(resourceGroup))
    }

    return webApps;
}

function getWebAppsFromResourceGroup(resourceGroup) {
    let webApps = [];
    for (let resource of resourceGroup.resources) {
        if (resource.type === "webapp") {
            webapps.push(resource);
        }
    }

    return webApps;
}

function isUrlShowingResourceGroups(uri) {
    if (uri.endsWith("/resourceGroups"))
        return true;

    return false;
}

/**
 * Updates the UI list
 */
function updateResourceGroupList() {
    const rows = $('div.fxc-gc-row-content');
    rows.each((index, row) => {
        // $(row).find('div.fxc-gc-cell.fxc-gc-columncell_0_0 a.fxc-gcflink-link').css("background-color", "red");
        // $(row).find('div.fxc-gc-cell.fxc-gc-columncell_0_1 a.fxc-gcflink-link').css("background-color", "green");

        let rgElem = $(row).find('div.fxc-gc-cell.fxc-gc-columncell_0_0 a.fxc-gcflink-link');
        let rgName = $(rgElem).text();

        let subElem = $(row).find('div.fxc-gc-cell.fxc-gc-columncell_0_1 a.fxc-gcflink-link');
        let subName = $(subElem).text();

        let sub = getSubscriptionFromName(subName);
        if (sub == null) {
            return;
        }

        let rg = getResourceGroup(rgName, sub);
        if (rg == null) {
            return;
        }

        if (rg.resources === null || rg.resources.length === 0) {
            $(row).css("border-style", "dashed");
            $(row).css("border-color", "red");

            $(rgElem).text($(rgElem).text() + " | Empty Resource Group");
            $(rgElem).attr('style', 'color: #FF0000;');
        }
    });
}

