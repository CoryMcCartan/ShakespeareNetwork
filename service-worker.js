/* 
 * Service Worker for offline use.
 */
var CACHE_VERSION = "v2";
var IMMEDIATE_DATA = [
    "bower_components/d3/d3.min.js",
    "bower_components/underscore/underscore-min.js",
    "bower_components/underscore.string/dist/underscore.string.min.js",
    "bower_components/material-design-lite/material.min.css",
    "bower_components/material-design-lite/material.min.js",
    "https://fonts.googleapis.com/css?family=Roboto:400,500,700,300",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "favicon.png",
    "data/sentiment/afinn.json",
];
var BIG_DATA = [
    "data/plays/all's well that ends well.xml",
    "data/plays/antony and cleopatra.xml",
    "data/plays/as you like it.xml",
    "data/plays/comedy of errors.xml",
    "data/plays/coriolanus.xml",
    "data/plays/cymbeline.xml",
    "data/plays/hamlet.xml",
    "data/plays/henry iv, part ii.xml",
    "data/plays/henry iv, part i.xml",
    "data/plays/henry v.xml",
    "data/plays/henry vi, part i.xml",
    "data/plays/henry vi, part ii.xml",
    "data/plays/henry vi, part iii.xml",
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
var DYNAMIC_CACHE = [
    location.pathname.replace("service-worker.js", ""), // basepath
    "index.html",
    "css/main.css",
    "js/lib.js",
    "js/sentiment.js",
    "js/graphics.js",
    "js/analyzer.js",
    "js/play.js",
    "js/ui.js",
    "js/storage.js",
    "js/glue.js",
    "js/main.js",
];
var CACHE = IMMEDIATE_DATA.concat(DYNAMIC_CACHE);
var STATIC_CACHE = IMMEDIATE_DATA.concat(BIG_DATA);

// say what we want cached
this.addEventListener("install", function(e) {
    e.waitUntil(
        caches.open(CACHE_VERSION)
        .then(function(cache) {
            cache.addAll(BIG_DATA); // data that isn't needed right away
            return cache.addAll(CACHE); // definitely get this stuff
        })
    );
});

// route requests the right way
this.addEventListener("fetch", function(e) {
    var url = new URL(e.request.url);

    var has = function(arr, test) {
        var length = arr.length
        for (var i = 0; i < length; i++) {
           if (arr[i] === test || 
                   (arr[i] === test.slice(1) && test !== "/") )
               return true; 
        }
        return false;
    };

    if (has(STATIC_CACHE, url.pathname)) { // prefer cached version
        e.respondWith(caches.match(e.request));
    } else if (has(DYNAMIC_CACHE, url.pathname)) { // prefer network version
        e.respondWith(
            fetch(e.request)
            .catch(function(r) {
                return caches.match(e.request);
            })
        );
    } else { // try cache, if not then get from network, then cache
        e.respondWith(
            caches.match(e.request)
            .then(function(response) {
                return response || fetch(e.request.clone())
                .then(function(r) {
                    return caches.open(CACHE_VERSION)
                    .then(function(cache) {
                        cache.put(e.request, r.clone());
                        return r;
                    })
                });
            })
        )
    }

});
