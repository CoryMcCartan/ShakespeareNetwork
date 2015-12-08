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
    var which = $("#location").value.split(":")[0].toLowerCase() || "combined";
    var network = networks[which];

    var minLines = Math.exp($("#min-lines").value) - 1;
    var minDegrees = Math.exp($("#min-degrees").value) - 1;
    var maxLines = _.reduce(network, (c, v) => Math.max(c, v.lines), 0);
    var maxDegrees = _.reduce(network, (c, v) => Math.max(c, v.degrees), 0);

    $("#min-lines").max = Math.log(maxLines);
    $("#min-degrees").max = Math.log(maxDegrees);

    Displayer.makeStatTable(network);
    Displayer.makeNetworkGraph(network, minLines, minDegrees);
    Displayer.makeChordDiagram(network, minLines, minDegrees);
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
    $("#min-lines").onchange = showData;
    $("#min-degrees").onchange = showData;
}
