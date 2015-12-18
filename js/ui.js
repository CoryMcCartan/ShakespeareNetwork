/*
 * This file deals with all the direct DOM manipulation and UI code.
 */

"use strict";

window.UI = (function() {
    var self = {};

    self.showData = function() {
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

        var sentiment = $("#sentiment-switch").checked;

        Mediator.trigger("display", network, minLines, minDegrees, sentiment);

        return false; // don't reload page
    };

    self.setupEventHandlers = function() {
        $("button#go").onclick = self.showData;
        $("button#load").onclick = loadPlay;
        $("#min-lines").onchange = self.showData;
        $("#min-degrees").onchange = self.showData;
        $("#sentiment-switch").onchange = self.showData;
    };

    self.getPlayName = function() {
        return $("#name").value || DEFAULT_PLAY;
    };
    self.setupPlayName = function(name, location) {
        $("#name").value = name;
        $("#location").value = location;
    };

    self.makeDatalist = function(play) {
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
    };

    self.startLongProcess = function() {
        $("#progress").style.display = "block";
    };
    self.endLongProcess = function() {
        $("#progress").style.display = "none";
    };

    return self;
})();
