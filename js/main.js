function main() {
    setupEventHandlers();

    Analyzer.onNetwork = onNetwork;
    loadPlay("Hamlet", Analyzer.analyzePlay);
}

function onNetwork(networks) {
    networks.combined = Analyzer.getCombined(networks);
    window.networks = networks;

    showData();
}

function showData(e) {
    var value = $("#location").value || "combined";
    var network = networks[value];
    Displayer.makeStatTable(network);
    Displayer.makeNetworkGraph(network);
    Displayer.makeChordDiagram(network);
}

function loadPlay(name, callback) {
    name = name || $("#name").value;
    callback = callback || NULLF;
    qwest.get("data/plays/" + name.toLowerCase() + ".xml")
        .then(function(xhr, response) {
            callback(xhr.responseXML);
        });
}

function setupEventHandlers() {
    $("button#go").onclick = showData;
    $("button#load").onclick = () => 
        loadPlay($("#name").value, Analyzer.analyzePlay);
}
