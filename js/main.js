var DEFAULT_PLAY = "Hamlet";
var DEFAULT_LOCATION = "Combined";

function main() {
    // hide modern browser warning
    (() => $("#noscript").remove())();
    
    UI.setupEventHandlers();

    window.analyzer = new Analyzer(Sentiment);
    
    Mediator.register(Glue);

    UI.refreshUI();

    loadPlay();
}


function loadPlay() {
    var name = UI.getPlayName();
    Storage.set("play", name);
    $("#comparison-list").innerHTML = null;

    // progress bar
    UI.startLongProcess();

    xhr("data/plays/" + name.toLowerCase() + ".xml", (response, xhr) => {
        console.log("Play fetched.");
        Mediator.trigger("loadraw", xhr.responseXML);
    });

    return false; // don't reload page
}

navigator.serviceWorker.register("service-worker.js", {scope: "/"}).then(() => {
    console.log("Service Worker registered.");
}).catch(LOGF);
