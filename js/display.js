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
            .charge((d) => -1.5*w - 4e4/persons - 1e4*d.lines/maxLines)
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

        var nodeColor = d3.scale.log()
            .domain([1, maxLength])
            .range(["#07a", "#1b3"])
        var edgeColor = "#888";
        var getId = (d) => d.source.name + "_" + (d.target|| {name: " "}).name; // how to ID edges
        var getLoc = (a, d) => a*(d.x2-d.x1)

        // node setup
        node = nodes.selectAll(".node")
            .data(graphData.nodes, (n) => n.name);
        node.enter().append("g")
            .attr("class", "node")
            .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
            .call(force.drag);
        node.append("circle")
            .attr("r", (d) => 5 + 140 * d.lines / totalLines)
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
            .data(graphData.edges, getId)
        edge.enter().append("line")
            .attr("class", "edge")
            .attr("id", (d) => "--" + getId(d))
            .attr("stroke", edgeColor)
            .style("stroke-width", (d) => 1.5 + 3 * d.length / maxLength)
            .attr("stroke-linecap", "round")
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        // reorder to have nodes cover edges
        d3.selectAll(".node, .edge").sort(function(d1, d2) {
            if (d1.name) return 1; // if a node
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

                if (_.find(edges, (e) => e.source === o && e.target === person)) // reverse node
                    continue;

                var src = network[person.name].edges[other];
                var trg = network[other].edges[person.name];

                edges.push({
                    source: person,
                    target: o,
                    length: src.count, // number of times spoken to
                    sentiment_s: src.sentiment,
                    sentiment_t: trg ? trg.sentiment : 0
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

        var color = d3.scale.sqrt()
            .domain([0, 0.5*maxLines, maxLines])
            .range(["#cca", "#dc4", "#cb3"])
        var sentimentColor = d3.scale.linear()
            .domain([minSent, 0, maxSent])
            .range(["#c00", "#897", "#0b2"])
        var fade = function(opacity) {
            return function(g, i) {
                graph.selectAll(".chord")
                    .filter((d)=> d.source.index !== i && d.target.index !== i)
                    .transition()
                    .style("opacity", opacity);
            };
        };

        var getId = (d) => d.source.index + "_" + d.target.index;

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
                    return "#58c";
                } else {
                    return "url(#" + getId(d) + ")";
                }
            })
            .style("opacity", 0.85);


        var coords = (type, d) => {
            var adj1s = Math.PI/2 - d.source.startAngle;
            var adj2s = Math.PI/2 - d.target.startAngle;
            var adj1e = Math.PI/2 - d.source.endAngle;
            var adj2e = Math.PI/2 - d.target.endAngle;
            var adj1 = 0.5 * (adj1s + adj1e);
            var adj2 = 0.5 * (adj2s + adj2e);

            var x1 = 0.5 * Math.cos(adj1);
            var y1 = 0.5 * Math.sin(adj1);
            var x2 = 0.5 * Math.cos(adj2);
            var y2 = 0.5 * Math.sin(adj2);

            var corners = [x1, y1, x2, y2];

            var h = 0.5 * (Math.sin(adj1) - Math.sin(adj2));
            var w = 0.5 * (Math.cos(adj1) - Math.cos(adj2));
            
//             var corners = [w<0 ? -w : 0, h<0 ? -h : 0, w<0 ? 0 : w, h<0 ? 0: h];
            var corners;
            if (w < 0) {
                if (h < 0) {
                    corners = [-w, 0, 0, -h];
                } else {
                    corners = [-w, h, 0, 0];
                }
            } else {
                if (h < 0) {
                    corners = [0, 0, w, -h];
                } else {
                    corners = [0, h, w, 0];
                }
                
            }

            return corners[type]; 
        };

        graph.append("defs").selectAll("linearGradient")
            .data(chord.chords)
            .enter().append("linearGradient")
            .attr("id", getId)
            .attr("x1", coords.bind(null, 0))
            .attr("y1", coords.bind(null, 1))
            .attr("x2", coords.bind(null, 2))
            .attr("y2", coords.bind(null, 3))
            .attr("spreadMethod", "pad")
            .selectAll("stop")
            .data((d) => {
                var s_s = chordData.sentiment[d.source.index][d.target.index];
                var s_t = chordData.sentiment[d.target.index][d.source.index];
                return [
                    {offset: "10%", color: sentimentColor(s_t)},
                    {offset: "90%", color: sentimentColor(s_s)}
                ]; 
            })
            .enter().append("stop")
            .attr("offset", (d) => d.offset)
            .attr("stop-color", (d) => d.color)
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
