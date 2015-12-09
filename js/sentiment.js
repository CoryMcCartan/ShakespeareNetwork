"use strict";

window.Sentiment = (function() {
    var self = {};

    var afinn;

    qwest.get("data/sentiment/AFINN.json", {dataType: "json"})
    .then(function(xhr, response) {
        afinn = response;     
    });

    self.extract = function(text) {
        var score = 0;
        var tokens = tokenize(text);

        for (var token of tokens) {
            if (!_.has(afinn, token)) continue;

            score += afinn[token];
        }

        return score;
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
