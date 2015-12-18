/*
 * Analyzes the sentiment of a text with the AFINN library.
 */

"use strict";

window.Sentiment = (function() {
    var self = {};

    var afinn;

    xhr({
        url: "data/sentiment/afinn.json",
        type: "json",
        onload: (response) => {
            afinn = response;
        }
    });

    self.extract = function(text) {
        var score = 0;
        var tokens = tokenize(text);

        for (var token of tokens) {
            if (!_.has(afinn, token)) continue;

            score += afinn[token];
        }

        return score / tokens.length;
    }; 

    var tokenize = function(str) {
        return str
            .replace(/\n/g, ' ')
            .replace(/[^a-zA-Z- ]+/g, '')
            .replace('/ {2,}/',' ')
            .toLowerCase()
            .split(' ');   
    };

    return self;
})();
