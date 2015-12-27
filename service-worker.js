/* 
 * Service Worker for offline use.
 */
var CACHE_VERSION = "v2";
var CACHED_OBJECTS = [
    location.pathname.replace("service-worker.js", ""), // basepath
    "index.html",
    "css/main.css",
    "bower_components/d3/d3.min.js",
    "bower_components/underscore/underscore-min.js",
    "bower_components/underscore.string/dist/underscore.string.min.js",
    "js/lib.js",
    "js/sentiment.js",
    "js/graphics.js",
    "js/analyzer.js",
    "js/play.js",
    "js/ui.js",
    "js/storage.js",
    "js/glue.js",
    "js/main.js",
    "bower_components/material-design-lite/material.min.css",
    "bower_components/material-design-lite/material.min.js",
    "https://fonts.googleapis.com/css?family=Roboto:400,500,700,300",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "favicon.png",
    "data/sentiment/afinn.json",
    "data/plays/all's well that ends well.xml",
    "data/plays/antony and cleopatra.xml",
    "data/plays/as you like it.xml",
    "data/plays/comedy of errors.xml",
    "data/plays/coriolanus.xml",
    "data/plays/cymbeline.xml",
    "data/plays/hamlet.xml",
    "data/plays/henry iv, part 2.xml",
    "data/plays/henry iv, part i.xml",
    "data/plays/henry v.xml",
    "data/plays/henry vi, part 1.xml",
    "data/plays/henry vi, part 2.xml",
    "data/plays/henry vi, part 3.xml",
    "data/plays/henry viii.xml",
    "data/plays/julius caesar.xml",
    "data/plays/king john.xml",
    "data/plays/king lear.xml",
    "data/plays/love's labor's lost.xml",
    "data/plays/lucrece.xml",
    "data/plays/macbeth.xml",
    "data/plays/measure for measure.xml",
    "data/plays/merchant of venice.xml",
    "data/plays/merry wives of windsor.xml",
    "data/plays/midsummer night's dream.xml",
    "data/plays/much ado about nothing.xml",
    "data/plays/othello.xml",
    "data/plays/pericles.xml",
    "data/plays/richard ii.xml",
    "data/plays/richard iii.xml",
    "data/plays/romeo and juliet.xml",
    "data/plays/taming of the shrew.xml",
    "data/plays/tempest.xml",
    "data/plays/the phoenix and turtle.xml",
    "data/plays/the two noble kinsmen.xml",
    "data/plays/timon of athens.xml",
    "data/plays/titus andronicus.xml",
    "data/plays/troilus and cressida.xml",
    "data/plays/twelfth night.xml",
    "data/plays/two gentlemen of verona.xml",
    "data/plays/venus and adonis.xml",
    "data/plays/winter's tale.xml"
];

// say what we want cached
this.addEventListener("install", function(e) {
    e.waitUntil(
        caches.open(CACHE_VERSION)
        .then(function(cache) {
            return cache.addAll(CACHED_OBJECTS);
        })
    );
});

// route requests the right way
this.addEventListener("fetch", function(e) {
    e.respondWith(
        fetch(e.request)
        .catch(function(r) {
            return caches.match(e.request);
        })
    );
});
