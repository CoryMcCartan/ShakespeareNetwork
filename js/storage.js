/*
 * Mange storage and data persistence.
 */

"use strict";

window.Storage = {};

Storage.get = function(key, defaultValue) {
    return localStorage[key] || defaultValue;
};

Storage.set = function(key, value) {
    localStorage[key] = value;
};
