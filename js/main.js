function main() {
    setupEventHandlers();

    Analyzer.onNetwork = onNetwork;
    loadPlay("Hamlet", onLoadPlay);
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
    var value = $("#location").value.split(":")[0].toLowerCase() || "combined";
    var network = networks[value];
    Displayer.makeStatTable(network);
    Displayer.makeNetworkGraph(network);
    Displayer.makeChordDiagram(network);
}

function loadPlay(name, callback) {
    name = name || $("#name").value;
    callback = callback || NULLF;

    // progress bar
    $("#progress").style.display = "block";

    qwest.get("data/plays/" + name.toLowerCase() + ".xml")
        .then(function(xhr, response) {
            callback(xhr.responseXML);
            $("#progress").style.display = "none";
        });
}

function setupEventHandlers() {
    $("button#go").onclick = showData;
    $("button#load").onclick = () => 
        loadPlay($("#name").value, onLoadPlay);
}
