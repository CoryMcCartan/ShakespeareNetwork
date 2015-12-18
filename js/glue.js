var DEFAULT_PLAY = "Hamlet";
var DEFAULT_LOCATION = "Combined";

function main() {
    UI.setupEventHandlers();

    window.analyzer = new Analyzer(Sentiment);
    
    Mediator.register(Glue);

    var location = getCachedLocation(DEFAULT_PLAY, DEFAULT_LOCATION);
    UI.setupPlayName(location.play, location.location);

    loadPlay();
}


function loadPlay() {
    var name = UI.getPlayName();
    localStorage.play = name;

    // progress bar
    UI.startLongProcess();

    xhr("data/plays/" + name.toLowerCase() + ".xml", (response, xhr) => {
        Mediator.trigger("loadraw", xhr.responseXML);
        UI.endLongProcess();
    });

    return false; // don't reload page
}

function getCachedLocation(play, location) {
    return {
        play: localStorage.play || play,
        location: localStorage.location || location
    };
};
