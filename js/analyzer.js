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
        var characters = []; // list of those on stage

        // generate network
        var els = scene.children;
        var length = els.length;
        outer:
        for (var i = 0; i < length; i++) {
            var el = els[i]; 
            switch(el.tagName) {
                case "sp":
                    if (!el.attributes.who) continue; // not a real line
                    var speaker = play.getSpeaker(el);
                    var num = play.countLines(el);

                    if (!network[speaker]) { // create entry for character if needed
                        network[speaker] = {lines: 0,  edges: {}};
                    }

                    network[speaker].lines += num;

                    if (characters.indexOf(speaker) === -1) { // if somehow slipped through
                        characters.push(speaker);
                    }

                    break;
                case "stage":
                    var type = el.attributes.type.value;
                    if (type === "entrance") {
                        var people = el.attributes.who.value.split(" ");
                        people = _.map(people, (p) => 
                                p.split("_")[0].slice(1).toUpperCase());

                        characters = _.union(people, characters);
                    } else if (type === "exit") {
                        var people = el.attributes.who.value.split(" ");
                        people = _.map(people, (p) => 
                                p.split("_")[0].slice(1).toUpperCase());

                        characters = _.difference(characters, people);
                    } else if (type === "business") {
                        var target = play.getTarget(el);
                        if (target === "WITHDRAW") {
                            var people = el.attributes.who.value.split(" ");
                            people = _.map(people, (p) => 
                                    p.split("_")[0].slice(1).toUpperCase());

                            characters = _.difference(characters, people);
                        }
                    }

                default:
                    continue outer;
            }
            // determine who they are speaking to
            var delivery = el.$("stage[type=delivery]");
            var sp;
            if (delivery) { // aside or "to" someone
                var target = play.getTarget(delivery);
                if (target === "ASIDE") {
                    sp = speaker;  
                } else if (target !== "" && target !== "SINGS") {
                    sp = target;
                } else {
                    lastSpeaker = speaker;
                    continue;
                }
            } else if (characters.length === 1) { // alone on stage
                sp = speaker;
            } else if (characters.length === 2) {
                sp = _.difference(characters, [speaker])[0]; // find th listener 
            } else if (lastSpeaker) {
                sp = lastSpeaker;
            } else {
                lastSpeaker = speaker;
                continue;
            } 

            // add 1 to the edge
            if (!network[speaker].edges[sp]) {
                network[speaker].edges[sp] = 0;
            }
            network[speaker].edges[sp]++;

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
