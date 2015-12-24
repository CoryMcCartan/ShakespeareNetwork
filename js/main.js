var DEFAULT_PLAY = "Hamlet";
var DEFAULT_LOCATION = "Combined";

function main() {
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
        Mediator.trigger("loadraw", xhr.responseXML);
    });

    return false; // don't reload page
}
