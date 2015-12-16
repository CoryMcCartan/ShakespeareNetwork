"use strict";

var Displayer = (function() {
    var self = {};

    var stats, previousSort;
    var parentEl = $("#data > div");
    const w = 600;
    const h = 600;

    self.makeStreamGraph = function(networks, minLines, minDegrees) {
        var streamData = createStreamMatrix(networks, minLines, minDegrees);

        var maxLength = _.reduce(_.omit(networks, "combined"), (c, v) => 
            Math.max(c, _.reduce(v, (p, n) => Math.max(p, n.degrees), 0)), 0);
        var maxLines = _.reduce(networks.combined, (c, v) => 
            Math.max(c, v.lines), 0);
        var numScenes = streamData.scenes.length;
        var persons = _.keys(streamData.people).length;

        var stack = d3.layout.stack().offset("silhoutte");
        var layer = stack(streamData.matrix);

        var x = d3.scale.linear()
            .domain([0, numScenes - 1])
            .range([0, w]);
        var y = d3.scale.linear()
            .domain([0, maxLength])
            .range([0, 0.5*h]);

        var color = d3.scale.category20();

        var area = d3.svg.area()
            .x((d) => x(d.x))
            .y0((d) => 0.5*h + y(0*d.y + d.y0))
            .y1((d) => 0.5*h + y(d.y + d.y0));

        $("#stream").innerHTML = null; // clear previous graph
        var stream = d3.select("#stream").append("svg");
        stream.attr("width", w);
        stream.attr("height", h);

        var el = $("#player-name");
        stream.selectAll("path")
            .data(layer)
            .enter().append("path")
            .attr("d", area)
            .on("mouseover", (e, i) => {
                var name = streamData.people[i];
                el.innerHTML = name;
            })
            .style("fill", (d, i) => color(i));
    };
    var createStreamMatrix = function(networks, minLines, minDegrees) {
        var index = {};       
        var network = networks.combined;
        var scenes = _.difference(_.keys(networks), ["combined"]); // list of scenes

        // compute a unique index
        var i = 0;
        for (var person in network) {
            if (network[person].degrees < minDegrees) continue;
            if (network[person].lines < minLines) continue;

            index[person] = i++; 
        }
        
        var invert = _.invert(index); //rverse lookup
        var l = _.keys(index).length;
        var matrix = new Array(l);

        // generate matrix
        for (var person in index) {
            matrix[index[person]] = new Array(scenes.length);

            for (var s = 0; s < scenes.length; s++) {
                var scene = scenes[s];
                network = networks[scene];

                var degrees = (network[person] || {degrees: 0}).degrees;

                matrix[index[person]][s] = {
                    x: s,
                    y: degrees
                };
            }
        }

        return {
            matrix: matrix,
            people: invert,
            scenes: scenes
        };
    };

    self.makeNetworkGraph = function(network, minLines, minDegrees) {
        var totalLines = _.reduce(network, (c, v) => c + v.lines, 0);
        var maxLines = _.reduce(network, (c, v) => Math.max(c, v.lines), 0);
        var maxLength = _.reduce(network, (c, v) => Math.max(c, v.degrees), 0);
        var center = _.reduce(network, (c, v, i, net) => 
                      net[c].degrees > v.degrees ? c : i, _.keys(network)[0]);

        var graphData = processNetwork(network, w, h, minLines, 
                            minDegrees, center);
        var persons = graphData.nodes.length;

        $("#graph").innerHTML = null; // clear previous graph
        var graph = d3.select("#graph").append("svg");
        graph.attr("width", w);
        graph.attr("height", h);

        // force directed layout
        var force = d3.layout.force()
            .size([w, h])
            .charge((d) => d.name === center ? -2e5/persons : -1.4*w - 1.1e5/persons)
            .gravity(0.6)
            .on("tick", () => {
                node.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");

                edge
                    .attr("x1", (d) => d.source.x)
                    .attr("y1", (d) => d.source.y)
                    .attr("x2", (d) => d.target.x)
                    .attr("y2", (d) => d.target.y);
            });
        var drag = force.drag().on("dragstart", function(d) {
            d3.select(this).classed("fixed", d.fixed = true);      
        });

        // nodes and edges

        var nodes = graph.append("g").attr("id", "nodes");
        var edges = graph.append("g").attr("id", "edges");
        var maxSent = _.reduce(network, (c, v) => Math.max(c, v.sentiment), 0);
        var minSent = _.reduce(network, (c, v) => Math.min(c, v.sentiment), 0);
        var node, edge;

        var nodeColor = d3.scale.linear()
            .domain([0, maxLength])
            .range(["#08a", "#1b3"])
        var edgeColor = d3.scale.linear()
            .domain([minSent, maxSent])
            .range(["#a00", "#992", "#0a3"]);

        // node setup
        node = nodes.selectAll(".node")
            .data(graphData.nodes, (n) => n.name);
        node.enter().append("g")
            .attr("class", "node")
            .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
            .call(force.drag);
        node.append("circle")
            .attr("r", (d) => 4 + 140 * d.lines / totalLines)
            .style("fill", (d) => nodeColor(d.degrees))
            .style("opacity", 0.7)
            .style("stroke", "white")
            .style("stroke-width", 2)
            .on("dblclick", function(d) {
                d3.select(this).classed("fixed", d.fixed = false);      
            });
        node.append("text")
            .attr("dx", 8)
            .attr("dy", "0.35em")
            .attr("font-size", 10)
            .attr("font-weight", "bold")
            .text((d) => d.name);

        // edge setup
        edge = edges.selectAll("line.edge")
            .data(graphData.edges, (n) => 
                n.source.name + " -> " + (n.target|| {name: " "}).name); // how to ID edges
        edge.enter().append("line")
            .attr("class", "edge")
            .attr("stroke", (d) => edgeColor(d.sentiment))
            .style("stroke-width", (d) => 1 + 3 * d.length / maxLength)
            .attr("stroke-linecap", "round")
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        //reorder
        d3.selectAll(".node, .edge").sort(function(d1, d2) {
            if (d1.name) return 1;
            return -1;
        });


        force.nodes(graphData.nodes);
        force.links(graphData.edges);
        force.start();

        window.force = force;
    };
    var processNetwork = function(network, w, h, minLines, minDegrees, center) {
        var nodes = [];
        var edges = [];

        for (var person in network) {
            if (network[person].degrees < minDegrees) continue;
            if (network[person].lines < minLines) continue;

            nodes.push({
                name: person,
                lines: network[person].lines,
                degrees: network[person].degrees,
                x: person === center ? w/2 : ~~(Math.random() * w), // center the center person, otherwise random
                y: person === center ? h/2 : ~~(Math.random() * h),
                fixed: person === center // don't move the center
            });
        }
        for (var person of nodes) {
            if (!network[person.name]) continue; // if they don't talk

            for (var other in network[person.name].edges) {
                var o = _.find(nodes, (p) => p.name === other);
                if (!o) continue;

                edges.push({
                    source: person,
                    target: o,
                    length: network[person.name].edges[other].count, // number of times spoken to
                    sentiment: network[person.name].edges[other].sentiment
                });
            }
        }

        return {
            nodes: nodes,
            edges: edges
        };
    };

    self.makeChordDiagram = function(network, minLines, minDegrees) {
        const innerRadius = Math.min(w, h) * .35;
        const outerRadius = innerRadius * 1.1;

        var maxLines = _.reduce(network, (c, v) => Math.max(c, v.lines), 0);
        var totalLines = _.reduce(network, (c, v) => c + v.lines, 0);
        var maxSent = _.reduce(network, (c, v) => Math.max(c, v.sentiment),-99);
        var minSent = _.reduce(network, (c, v) => Math.min(c, v.sentiment), 99);
        var persons = _.keys(network).length;

        $("#chord").innerHTML = null; // clear previous
        var graph = d3.select("#chord")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .append("g")
            .attr("transform", 
                "translate(" + (w/2 + 20) + "," + (h/2 + 20) + ")");


        var chordData = createChordMatrix(network, minLines, minDegrees);

        var chord = d3.layout.chord()
            .padding(0.05)
            .sortSubgroups(d3.descending)
            .matrix(chordData.matrix);

        var color = d3.scale.linear()
            .domain([0, 2*Math.pow(maxLines, 0.72)])
            .range(["#ccc", "#a00"])
        var sentimentColor = d3.scale.linear()
            .domain([minSent, maxSent])
            .range(["#c00", "#aa2", "#0a1"])
        var fade = function(opacity) {
            return function(g, i) {
                graph.selectAll(".chord")
                    .filter((d)=> d.source.index !== i && d.target.index !== i)
                    .transition()
                    .style("opacity", opacity);
            };
        }

        var arc = d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius);

        var g = graph.selectAll(".arc")
            .data(chord.groups)
            .enter().append("g")
            .attr("class", "arc")
            .on("mouseover", fade(.1))
            .on("mouseout", fade(0.85));
        g.append("path")
            .style("fill", (d) => color(d.value))
            .style("stroke", "white")
            .attr("d", arc);
        g.append("text")
            .each((d) => d.angle = (d.startAngle + d.endAngle) / 2)
            .attr("dy", "0.35em")
            .attr("font-size", 10)
            .attr("font-weight", "bold")
            .attr("text-anchor", (d) => d.angle > Math.PI ? "end" : null)
            .attr("transform", (d) =>  {
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (innerRadius + 26) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "");
            })
        .text((d) => chordData.people[d.index]);
        
        graph.selectAll("path.chord")
            .data(chord.chords)
            .enter().append("path")
            .attr("class", "chord")
            .attr("d", d3.svg.chord().radius(innerRadius))
            .style("fill", (d) => {
                if (d.source.index === d.target.index) { // soliloquy
                    return "#78f";
                } else {
                    var s = chordData.sentiment[d.source.index][d.target.index];
                    return sentimentColor(s);
                }
            })
            .style("opacity", 0.85);
    };
    var createChordMatrix = function(network, minLines, minDegrees) {
        var index = {};

        // compute a unique index
        var i = 0;
        for (var person in network) {
            if (network[person].degrees < minDegrees) continue;
            if (network[person].lines < minLines) continue;

            index[person] = i++; 
        }

        var invert = _.invert(index); // reverse lookup
        var l = _.keys(index).length;
        var matrix = new Array(l);
        var sentiments = new Array(l);

        // generate matrix
        for (var person in index) {
            var x = index[person];
            matrix[x] = new Array(l);
            sentiments[x] = new Array(l);

            for (var y = 0; y < l; y++) {
                var obj = network[person].edges[invert[y]];
                matrix[x][y] = obj ? obj.lines : 0;
                sentiments[x][y] = obj ? obj.sentiment : 0;
            }
        }

        return {
            people: invert, 
            sentiment: sentiments,
            matrix: matrix
        };
    };

    self.makeStatTable = function(_stats) {
        stats = {};
        // find total
        var total = {lines: 0, degrees: _.keys(_stats).length};
        for (var p in _stats) {
            total.lines += _stats[p].lines;
            stats[p] = _stats[p];
        }
        stats["TOTAL"] = total;

        // clear table
        $("table#stats > thead").innerHTML = null;
        $("table#stats > tbody").innerHTML = null;
        
        displayTable(null);
    };
    var displayTable = function(sortOn) {
        // create the header
        var thead = d3.select("table#stats > thead").selectAll("th") // pick el for header
            .data(["Character", "Lines", "Interactions"]) // list column titles
            .enter().append("th").text(_.identity) // fill elements
            .on("click", displayTable.bind(this)); // event listener for sort

        // fill the table & create rows
        var tr = d3.select("table#stats > tbody").selectAll("tr")
            .data(_.keys(stats));
        tr.enter().append("tr");

        // fill cells
        var td = tr.selectAll("td").data((id) => {
            return [id, stats[id].lines, stats[id].degrees]; 
        });
        td.enter().append("td");

        // sort
        switch (sortOn) {
            case "Character":
                tr.sort();
                break;
            case "Lines":
                tr.sort(function(a, b) {
                    return stats[b].lines - stats[a].lines;
                });
                break;
            case "Interactions":
                tr.sort(function(a, b) {
                    return stats[b].degrees - stats[a].degrees;
                });
                break;
        }

        td.text(_.identity);
    };

    return self;
})();
