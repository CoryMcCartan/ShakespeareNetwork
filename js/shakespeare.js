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

    this.getScenes = function() {
        var scenelist = [];
        var acts = this.countActs();
        for (var a = 1; a <= acts; a++) {
            var act = this.getAct (a);
            var scenes = this.countScenes(act);
            for (var s = 1; s <= scenes; s++) {
                var scene = act.$$("div2")[s - 1];
                var list = Array.prototype.slice.call(scene.$("head").children);
                scenelist.push(a + "." + s);
            }
        }

        return scenelist;
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
        var speaker;

        if (!!s_el) { // if normal
            var list = Array.prototype.slice.call(s_el.children);
            speaker = extractText(list);
        } else { // no speaker sub element
            speaker = el.attributes.who.value.split("_")[0].slice(1).toUpperCase(); // dirty way
        }

        if (speaker.split("/").length > 1) { // two possible characters
            speaker = speaker.split("/")[0]; // pick the first one 
        }
        
        return speaker;
    };

    var extractText = function(list) {
        var text = "";
        for (let el of list) {
            switch(el.tagName) {
                case "w":
                case "c":
                case "pc":
                case "foreign":
                    text += el.textContent;
                    break;
                case "lb":
                    text += "\n"; 
                    break;
                case "q": // quoted text: recursion
                    var newlist = Array.prototype.slice.call(el.children);
                    text += extractText(newlist);
                    break;
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
