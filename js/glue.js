/*
 * The Gluer connects the events, triggers, and objects together to create the
 * full application
 */

"use strict";

window.Glue = {};

Glue.onanalyze = function(networks) {
    networks.combined = analyzer.getCombined(networks);
    window.networks = networks;

    UI.makeDatalists(play);
    UI.showData();
};

Glue.onloadraw = (xml) => {
    window.play = new Play(xml);

    analyzer.analyzePlay(play);
};

Glue.ondisplay = (network, minLines, minDegrees, sentiment, comparisonList) => {
    Displayer.makeStatTable(network);
    Displayer.makeNetworkGraph(network, minLines, minDegrees);
    Displayer.makeChordDiagram(network, minLines, minDegrees, sentiment);
    Displayer.makeStreamGraph(networks, minLines, minDegrees);
    Displayer.makeComparison(networks, comparisonList);
    UI.endLongProcess();
};
