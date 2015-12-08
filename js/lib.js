/*
 * JS LIBRARY
 * CORY McCARTAN
 * AUGUST 2015
 */

// call main()
document.addEventListener("readystatechange", function() {
	if (document.readyState === "complete") main();
});

// DOM getters
window.$ = function(s) { return document.querySelector(s); };
window.$$ = function(s) { return document.querySelectorAll(s); };

// utility functions
window.NULLF = function() { };
window.LOGF = function(l) { console.log(l); };

/**
 * Load a file via XMLHttpRequest
 *
 * You can pass an object, or a url + callback.  If passing an object, use the
 * following format:
 *
 * url: (required) The path to the file to load.
 * onload: the callback function when the file is loaded
 * type: the type of the file (e.g. 'blob', 'arraybuffer'.  Default is plain
 * 		text.
 * method: 'GET' or 'POST.'  Default is 'GET.'
 */
function xhr(arg1, arg2) {
	var url = "";
	var callback = NULLF;
	var type = "";
	var method = "GET";

	var request = new XMLHttpRequest();
	
	if (typeof arg1 === "object") {
		url = arg1.url;
		callback = arg1.onload || callback;
		type = arg1.type || type;
		method = arg1.method || method;
	} else {
		url = arg1;
		callback = arg2;
	}

	request.onload = function(e) {
		if (request.readyState === 4) {
			callback(request.response);
	 	}
	};

	request.open(method, url, true);
	request.responseType = type;
	request.send();
}

// DATA BINDING
ModelView = (function() {
	var model;

	var links = {};

	var handler = function(changes) {
		changes.forEach(function(change) {
			var key = change.name;
			var linkers = links[key];
			var length = linkers.length;

			for (var i = 0; i < linkers.length; i++) {
				linkers[i](model[key])
			};
		});
	};
	
	var init = function(_model) {
		model = _model || window.model;

		Object.observe(model, handler, ["add", "update"]);
	};

	var link = function(key, linker) {
		if (!links[key]) links[key] = [];

		links[key].push(linker);

		linker(model[key]); // update 1st time
	};

	// linker functions
	var l_text = function(s, formatter) {
		var el;
		if (typeof s === "string") {
			el = $(s);
		} else { // passed a DOM element
			el = s; 
		}

		return function(val) {
			if (formatter) val = formatter(val);
			el.innerHTML = val;
		};
	};
	var l_class = function(s, classname) {
		var el;
		classname = " " + classname;
		if (typeof s === "string") {
			el = $(s);
		} else { // passed a DOM element
			el = s; 
		}

		return function(val) {
			if (val) {
				el.className += classname;
			} else {
				el.className = el.className.replace(classname, "");
			}
		};
	};
	var l_style = function(s, attr, formatter) {
		var el;
		if (typeof s === "string") {
			el = $(s);
		} else { // passed a DOM element
			el = s; 
		}

		return function(val) {
			if (formatter) val = formatter(val);
			el.style[attr] = val;
		};
	};

	var l_attr = function(s, attr, formatter) {
		var el;
		if (typeof s === "string") {
			el = $(s);
		} else { // passed a DOM element
			el = s; 
		}

		return function(val) {
			if (formatter) val = formatter(val);
			el.setAttribute(attr, val);
		};
	};

	var exports = {};
	exports.init = init;
	exports.link = link;

	exports.textLinker = l_text;
	exports.classLinker = l_class;
	exports.styleLinker = l_style;
	exports.attributeLinker = l_attr;

	return exports;
})();

HTMLElement.prototype.linkText = function(key, formatter) {
	ModelView.link(key, ModelView.textLinker(this, formatter));
};
