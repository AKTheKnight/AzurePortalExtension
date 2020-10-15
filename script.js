'use strict';

logScript("starting");

function updatePortal() {

    //All updates start in this thread
    if (isUrlShowingResourceGroups(window.location.href) === true) {
        updateResourceGroupList();
    }

    if (isUrlShowingResources(window.location.href) === true) {
        updateResourceList();
    }

    //Update every second
    setTimeout(updatePortal, 1000);
}

function updateData() {
    chrome.runtime.sendMessage("getSubscriptions", function(response) {
        logScript("sending getSubscriptions");
        subscriptions = response.subscriptions;
    });

    // Updating every 5 seconds as it might take a while with large accounts
    setTimeout(updateData, 5000);
}

//Wait one second to ensure we have got the azure Auth token in the background
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
    if (uri.toLowerCase().endsWith("/resourceGroups".toLowerCase())) {
        return true;
    }
    else if (uri.toLowerCase().endsWith("/BrowseResourceGroups".toLowerCase())) {
        return true;
    }

    return false;
}

function isUrlShowingResources(uri) {
    if (uri.toLowerCase().endsWith("/resources".toLowerCase())) {
        return true;
    }
    if (uri.toLowerCase().indexOf("/resourceGroups".toLowerCase()) !== -1
        && uri.toLowerCase().indexOf("/overview") !== -1) {
        return true;
    }

    return false;
}

function printSubscriptions() {
    console.log(subscriptions);
}

/**
 * Updates the UI list for resources
 */
function updateResourceList() {
    const rows = $('div.fxc-gc-row-content');
    rows.each((index, row) => {
        let linkdiv = $(row).find('a.fxc-gcflink-link');
        let link = $(linkdiv).attr("href");

        const linkRegexp = /resource\/subscriptions\/(?<sub>[^/]*)\/resourceGroups\/(?<rg>.*)\/providers\/(?<type>.*\/.*)\/(?<name>.*)/g;
        let matches = linkRegexp.exec(link);

        if (matches == null) {
            return;
        }

        let subscription = getSubscriptionFromId(matches.groups.sub);
        if (subscription == null) {
            return;
        }

        let resourceGroup = getResourceGroup(matches.groups.rg, subscription);
        if (resourceGroup == null) {
            return;
        }

        let resource = resourceGroup.resources.find(res => res.name === matches.groups.name);
        if (resource == null) {
            return;
        }

        if (resource.type === "Microsoft.Web/sites") {
            $(linkdiv).on("contextmenu", false, function(e) {
                addPopup();
                addPopupLink("Visit Website", resource.url);
                $("#ape-popup").show().css("top", e.pageY + "px").css("left", e.pageX + "px");
                e.preventDefault();
            });
        }
    });
}

function addPopup() {
    $('#ape-popup').remove();
    $(popup).appendTo("#web-container");
    $('#ape-popup').hide();

    $(document).on('click', function(e) {
        $('#ape-popup').remove();
    });
}

function addPopupLink(text, link) {
    $("#ape-popup").find('ul.fxs-contextMenu-itemList').append(
        "<a href=\""+ link + "\" target=\"_blank\">" +
        "<li role=\"menuitem\" class=\"fxs-contextMenu-item msportalfx-command-like-button fxs-portal-hover\">" +
        "<div class=\"fxs-contextMenu-text msportalfx-text-ellipsis\">" +
        text +
        "</div>" +
        "<div class=\"fxs-contextMenu-icon\">" +
        "</div>" +
        "</li>" +
        "</a>"
    );
}


/**
 * This function runs the same queries as updateResourceGroupList() but changes rgElem to red and rgSub to green for testing.
 */
function testUpdateResourceGroupList() {
    const rows = $('div.fxc-gc-row-content');
    rows.each((index, row) => {
        // noinspection CssInvalidPseudoSelector
        $(row).find('div:regex(class,fxc-gc-cell\.fxc-gc-columncell_[0-9]_0)').find('a.fxc-gcflink-link').css("background-color", "red");
        // noinspection CssInvalidPseudoSelector
        $(row).find('div:regex(class,fxc-gc-cell\.fxc-gc-columncell_[0-9]_1)').find('a.fxc-gcflink-link').css("background-color", "green");
    });
}

/**
 * Updates the UI list
 */
function updateResourceGroupList() {
    const rows = $('div.fxc-gc-row-content');
    rows.each((index, row) => {

        // noinspection CssInvalidPseudoSelector
        let rgElem = $(row).find('div:regex(class,fxc-gc-cell\.fxc-gc-columncell_[0-9]_0)').find('a.fxc-gcflink-link')
        let rgName = $(rgElem).text();

        // noinspection CssInvalidPseudoSelector
        let subElem = $(row).find('div:regex(class,fxc-gc-cell\.fxc-gc-columncell_[0-9]_1)').find('a.fxc-gcflink-link');
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

var popup = "<div id=\"ape-popup\" class=\"fxs-commands-contextMenu az-noprint fxs-contextMenu fxs-popup fxs-portal-bg-txt-br msportalfx-shadow-level2 msportalfx-unselectable fxs-contextMenu-active\">" +
    "    <ul role=\"menu\" class=\"fxs-contextMenu-itemList\">" +
/*    "        <li role=\"menuitem\" class=\"fxs-contextMenu-item msportalfx-command-like-button fxs-portal-hover\">\n" +
    "            <div class=\"fxs-contextMenu-text msportalfx-text-ellipsis\">\n" +
    "                Pin to dashboard\n" +
    "            </div>\n" +
    "            <div class=\"fxs-contextMenu-icon\">\n" +
    "                <svg height=\"100%\" width=\"100%\" aria-hidden=\"true\" role=\"presentation\" focusable=\"false\">\n" +
    "                    <use href=\"#FxSymbol0-00f\"></use>\n" +
    "                </svg>\n" +
    "            </div>\n" +
    "        </li>\n" +
    "        <li role=\"menuitem\" class=\"fxs-contextMenu-item msportalfx-command-like-button fxs-portal-hover\">\n" +
    "            <div class=\"fxs-contextMenu-text msportalfx-text-ellipsis\">\n" +
    "                Edit tags\n" +
    "            </div>\n" +
    "            <div class=\"fxs-contextMenu-icon\">\n" +
    "                <svg height=\"100%\" width=\"100%\" aria-hidden=\"true\" role=\"presentation\" focusable=\"false\">\n" +
    "                    <use href=\"#FxSymbol0-047\"></use>\n" +
    "                </svg>\n" +
    "            </div>\n" +
    "        </li>\n" +*/
    "    </ul>" +
    "</div>";