"use strict";

window.Analyzer = (function() {
    var self = {};

    self.analyzePlay = function(play) {
        var networks = {};
        
        // iterate over each scene
        var acts = play.countActs();
        for (var a = 1; a <= acts; a++) {
            var act = play.getAct (a);
            var scenes = play.countScenes(act);
            for (var s = 1; s <= scenes; s++) {
                var scene = act.$$("div2")[s - 1];

                networks[a + "." + s] = self.getNetwork(play, scene);
            }
        }

        self.onNetwork(networks);
    };

    self.getNetwork = function(play, scene) {
        var network = {};
        var lastSpeaker;

        // generate network
        var lines = scene.$$("sp");
        var length = lines.length;
        for (var l = 0; l < length; l++) {
            var line = lines[l]; 
            if (!line.attributes.who) continue; // not a real line
            var speaker = play.getSpeaker(line);
            var num = play.countLines(line);

            if (!network[speaker]) { // create entry for character if needed
                network[speaker] = {lines: 0,  edges: {}};
            }

            network[speaker].lines += num;

            if (l > 0) { // a previous speaker exists
                // add 1 to the edge
                if (!network[speaker].edges[lastSpeaker]) {
                    network[speaker].edges[lastSpeaker] = 0;
                }
                network[speaker].edges[lastSpeaker]++;
            }       

            lastSpeaker = speaker;
        }

        // quickly tally up degrees
        for (var person in network) {
            network[person].degrees = _.keys(network[person].edges).length;
        }

        return network; 
    };

    self.getCombined = function(networks) {
        var characters = {};
        for (var n in networks) { // for each scene
            var net = networks[n];

            // count lines and degrees for each player
            for (var person in net) {
                if (!characters[person]) {
                    characters[person] = {lines: 0, degrees: 0, edges: {}};
                }

                characters[person].lines += net[person].lines;
                characters[person].degrees = 0 ;
                var edges = net[person].edges;
                for (var i in edges) {
                    if (characters[person].edges[i]) {
                        characters[person].edges[i] += net[person].edges[i];
                    } else {
                        characters[person].edges[i] = net[person].edges[i];
                    }
                }
            }
        }
        // quickly tally up degrees
        for (var person in characters) {
            characters[person].degrees = _.keys(characters[person].edges).length;
        }

        return characters;
    };

    self.onNetwork = NULLF;

    return self;
})();
