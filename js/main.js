var DEFAULT_PLAY = "Hamlet";
var DEFAULT_LOCATION = "Combined";

function main() {
    setupEventHandlers();

    var location = getCachedLocation(DEFAULT_PLAY, DEFAULT_LOCATION);
    $("#name").value = location.play;
    $("#location").value = location.location;

    Analyzer.onNetwork = onNetwork;
    loadPlay(onLoadPlay);
}

function onLoadPlay(xml) {
    var play = new Play(xml);
    window.play = play;

    // put list of scenes into autocomplete
    var list = play.getScenes();
    list.push("Combined"); // to see entire play
    var datalist = $("#loc-list");
    datalist.innerHTML = null; // clear previous
    for (var s of list) {
        var el = document.createElement("option");
        el.value = s;
        datalist.appendChild(el);
    }

    setTimeout(Analyzer.analyzePlay.bind(this, play), 100)
}

function onNetwork(networks) {
    networks.combined = Analyzer.getCombined(networks);
    window.networks = networks;

    showData();
}

function showData() {
    var which = $("#location").value.split(":")[0].toLowerCase() ||
            DEFAULT_LOCATION.toLowerCase();
    var network = networks[which];

    localStorage.location = which;

    var minLines = Math.exp($("#min-lines").value) - 1;
    var minDegrees = Math.exp($("#min-degrees").value) - 1;
    var maxLines = _.reduce(network, (c, v) => Math.max(c, v.lines), 0);
    var maxDegrees = _.reduce(network, (c, v) => Math.max(c, v.degrees), 0);

    $("#min-lines").max = Math.log(maxLines);
    $("#min-degrees").max = Math.log(maxDegrees);

    Displayer.makeStatTable(network);
    Displayer.makeNetworkGraph(network, minLines, minDegrees);
    Displayer.makeChordDiagram(network, minLines, minDegrees);
    //Displayer.makeStreamGraph(networks, minLines, minDegrees);
    
    return false; // don't reload page
}

function loadPlay(callback) {
    var name = $("#name").value || DEFAULT_PLAY;
    callback = callback || NULLF;

    localStorage.play = name;

    // progress bar
    $("#progress").style.display = "block";

    qwest.get("data/plays/" + name.toLowerCase() + ".xml")
        .then(function(xhr, response) {
            callback(xhr.responseXML);
            $("#progress").style.display = "none";
        });

    return false; // don't reload page
}

function setupEventHandlers() {
    $("button#go").onclick = showData;
    $("button#load").onclick = loadPlay.bind(this, onLoadPlay);
    $("#min-lines").onchange = showData;
    $("#min-degrees").onchange = showData;
}

function getCachedLocation(play, location) {
    return {
        play: localStorage.play || play,
        location: localStorage.location || location
    };
};
