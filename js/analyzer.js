/*
 * Analyzes play data to create interaction networks.
 *
 * Call analyzePlay with a Play() object.  When done, an "analyze" event will be
 * triggered.
 *
 * Call getCombined to calculate combined statistics across an entire play.
 */


"use strict";

window.Analyzer = function(sentiment) {
    var self = {};

    self.analyzePlay = function(play) {
        var networks = {};
        
        // iterate over each scene
        var acts = play.countActs();
        for (var a = 0; a < acts; a++) {
            var act = play.getAct(a);
            var scenes = play.countScenes(act);
            for (var s = 0; s < scenes; s++) {
                var scene = play.getScene(act, s);;

                var str = play.getLocation(act, scene);
                networks[str] = getNetwork(play, scene);
            }
        }

        Mediator.trigger("analyze", networks); 
    };

    var getNetwork = function(play, scene) {
        var network = {};
        var lastSpeaker;
        var characters = []; // list of those on stage

        // generate network
        var length = scene.children.length;
        outer:
        for (var i = 0; i < length; i++) { // iterate over children of scene
            var el = scene.children[i]; 
            switch(el.tagName) {
                case "sp": // a speech
                    if (!el.attributes.who) continue; // not a real line
                    var speaker = play.getSpeaker(el);
                    var num = play.countLines(el);

                    if (!network[speaker]) { // create entry for character if needed
                        network[speaker] = {lines: 0,  edges: {}};
                    }

                    network[speaker].lines += num; // tally lines spoken

                    if (characters.indexOf(speaker) === -1) { // if somehow slipped through
                        characters.push(speaker);
                    }

                    break;
                case "stage": // a stage direction
                    var type = el.attributes.type.value;
                    if (type === "entrance") {
                        var people = el.attributes.who.value.split(" ");
                        people = _.map(people, (p) => 
                                p.split("_")[0].slice(1).toUpperCase());
 
                        characters = _.union(people, characters); // add character to list
                    } else if (type === "exit") {
                        var people = el.attributes.who.value.split(" ");
                        people = _.map(people, (p) => 
                                p.split("_")[0].slice(1).toUpperCase());

                        characters = _.difference(characters, people); // remove character from list
                    } else if (type === "business") {
                        var target = play.getTarget(el);
                        if (target === "WITHDRAW") { // WITHRAW is sometimes used as a way of exiting temporarily
                            var people = el.attributes.who.value.split(" ");
                            people = _.map(people, (p) => 
                                    p.split("_")[0].slice(1).toUpperCase());

                            characters = _.difference(characters, people); // remove character from list
                        }
                    }

                default: // other; skip.
                    continue outer;
            }
            // determine who they are speaking to
            var delivery = el.$("stage[type=delivery]"); // an aside or similar
            var sp;
            if (delivery) { // aside or "to" someone
                var target = play.getTarget(delivery);
                if (target === "ASIDE") { // if aside, they speak to themselves
                    sp = speaker;  
                } else if (target !== "" && target !== "SINGS" // they speak to another character
                    && target !== "(READS)") {
                    sp = target;
                } else { // otherwise, store this speaker and move on
                    lastSpeaker = speaker;
                    continue;
                }
            } else if (characters.length === 1) { // alone on stage
                sp = speaker;
            } else if (characters.length === 2) { // one other character
                sp = _.difference(characters, [speaker])[0]; // find the listener 
            } else if (lastSpeaker) { // default: assume they speak to whoever spoke last
                sp = lastSpeaker;
            } else { // otherwise, store this speaker and move on
                lastSpeaker = speaker;
                continue;
            } 

            // add 1 to the edge
            if (!network[speaker].edges[sp]) {
                network[speaker].edges[sp] = {
                    count: 0,
                    lines: 0,
                    sentiment: 0
                };
            }
            
            var text = play.getText(el);

            network[speaker].edges[sp].count++;
            network[speaker].edges[sp].lines += num;
            network[speaker].edges[sp].sentiment += sentiment.extract(text);

            lastSpeaker = speaker;
        }

        // quickly tally up degrees
        for (var person in network) {
            network[person].degrees = _.keys(network[person].edges).length;
            network[person].sentiment = _.reduce(network[person].edges, 
                (c, v) => c + v.sentiment/network[person].degrees, 0);
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
                        characters[person].edges[i].count += net[person].edges[i].count;
                        characters[person].edges[i].lines += net[person].edges[i].lines;
                        characters[person].edges[i].sentiment += net[person].edges[i].sentiment;
                    } else {
                        characters[person].edges[i] = net[person].edges[i];
                    }
                }
            }
        }

        // quickly tally up degrees
        for (var person in characters) {
            characters[person].degrees = _.keys(characters[person].edges).length;
            characters[person].sentiment = _.reduce(characters[person].edges, 
                (c, v) => c + v.sentiment/characters[person].degrees, 0);
        }

        return characters;
    };

    return self;
};
