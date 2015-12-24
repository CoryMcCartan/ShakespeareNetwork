/*
 * This file deals with all the direct DOM manipulation and UI code.
 */

"use strict";

window.UI = (function() {
    var self = {};

    var comparisonList = [];

    self.showData = function() {
        if (typeof networks === "undefined") return; // need analysis to be done

        var which = $("#location").value.split(":")[0].toLowerCase() ||
                DEFAULT_LOCATION.toLowerCase();
        var network = networks[which];

        Storage.set("location", which);

        var minLines = Math.exp($("#min-lines").value) - 1;
        var minDegrees = Math.exp($("#min-degrees").value) - 1;
        var maxLines = _.reduce(network, (c, v) => Math.max(c, v.lines), 0);
        var maxDegrees = _.reduce(network, (c, v) => Math.max(c, v.degrees), 0);

        $("#min-lines").max = Math.log(maxLines);
        $("#min-degrees").max = Math.log(maxDegrees);

        var sentiment = $("#sentiment-switch").checked;
        Storage.set("show-sentiment", sentiment);

        Mediator.trigger("display", network, minLines, minDegrees, sentiment,
                        comparisonList);

        return false; // don't reload page
    };

    self.setupEventHandlers = function() {
        $("button#go").onclick = self.showData;
        $("button#load").onclick = loadPlay;
        $("#min-lines").onchange = self.showData;
        $("#min-degrees").onchange = self.showData;
        $("#sentiment-switch").onchange = self.showData;
        $("button#add-player").onclick = self.addPlayer;
    };

    self.getPlayName = function() {
        return $("#name").value || DEFAULT_PLAY;
    };

    self.makeDatalists = function(play) {
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

        var list = _.keys(networks.combined);

        datalist = $("#players-list");
        datalist.innerHTML = null;
        for (var s of list) {
            var el = document.createElement("option");
            el.value = s;
            datalist.appendChild(el);
        }
    };

    self.startLongProcess = function() {
        $("#progress").style.display = "block";
    };
    self.endLongProcess = function() {
        $("#progress").style.display = "none";
    };

    self.addPlayer = function() {
        var name = $("#player").value.toUpperCase();
        if (name === "") return;

        var item = $("el-templates .character").cloneNode(true); // true for recursive copy
        item.querySelector(".name").innerHTML = name;
        item.querySelector(".delete").onclick = self.removePlayer;
        $("#comparison-list").appendChild(item);
        comparisonList.push(name);
        // clear field
        $("#player").value = "";

        self.showData();
        
        return false;
    };
    self.removePlayer = function() {
        var name = this.parentElement.querySelector(".name").innerHTML;
        this.parentElement.remove();
        comparisonList = _.without(comparisonList, name);

        self.showData();
    };

    self.refreshUI = function() {
        var sentiment = Storage.get("show-sentiment", false) === "true";
        sentiment ? null : $("#sentiment-switch").click();  // click and switch to off if needed
        $("#name").value = Storage.get("name", DEFAULT_PLAY);
        $("#location").value = Storage.get("location", DEFAULT_LOCATION);
    };

    return self;
})();
