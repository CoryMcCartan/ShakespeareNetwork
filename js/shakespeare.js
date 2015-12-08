"use strict";

window.Play = function(xml) {
    this.raw = xml;

    var persons = xml.$$("listPerson > person");

    this.getAct = function(act) {
        return xml.$("div1[n='" + act + "']"); 
    };

    this.getScene = function(el, scene) {
        var act = el.attributes.n.value;
        return xml.$("div1[n='" + act + "']")
            .$("div2[n='" + scene + "']");
    };

    this.countActs = function() {
        return xml.$$("div1").length;   
    };
    this.countScenes = function(el) {
        return el.$$("div2").length;   
    };

    this.getLine = function(str) {
        var els = xml.$$("[n='" + str + "']");
        var w_els = Array.prototype.slice.call(els, 1);
        return extractText(w_els);
    };

    this.getLines = function(act, scene, l1, l2) {
        var lines = [];
        for (var l = l1; l <= l2; l++) {
            var str = act + "." + scene + "." + l;
            lines.push(this.getLine(str));
        }   
        return lines;
    };

    this.getText = function(el) {
        var ab_el = el.$("ab");
        var line_els = Array.prototype.slice.call(ab_el.children, 1);
        return extractText(line_els);
    };

    this.countLines = function(el) {
        return this.getText(el).count("\n") + 1;
    };

    this.getSpeaker = function(el) {
        var s_el = el.$("speaker");
        if (!!s_el) {
            var list = Array.prototype.slice.call(s_el.children);
            return extractText(list);
        } else {
            return el.attributes.who.value.split("_")[0].slice(1).toUpperCase(); // dirty way
        }
    };

    var extractText = function(list) {
        var text = "";
        for (let el of list) {
            if (el.tagName === "lb") { // line break
                text += "\n"; 
            } else {
                text += el.textContent;
            }
        }

        return text;
    };

    this.$ = function(selector) {
        return xml.querySelector(selector);
    }
    this.$$ = function(selector) {
        return xml.querySelectorAll(selector);
    }
};

Node.prototype.$ =  function(selector) {
    return this.querySelector(selector);
}
Node.prototype.$$ = function(selector) {
    return this.querySelectorAll(selector);
}

String.prototype.count = function(str) {
    var matches = this.match(new RegExp(str, "g"));
    if (!matches) return 0;
    return matches.length;
};
