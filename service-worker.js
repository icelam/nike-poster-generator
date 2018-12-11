/*
 * Service Worker for making webpage offline accessable
 * rhttps://developers.google.com/web/fundamentals/codelabs/offline/
 * https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#Updating_your_service_worker
 */

// Cache version
var CACHE = 'nike_v2';

// Not all browser support addAll method, need polyfill form: https://github.com/coonsta/cache-polyfill
importScripts('assets/vendor/cache-polyfill.js');

// Opens the caches object and populates it with list of resources to cache
self.addEventListener('install', function(e) {
 e.waitUntil(
   caches.open(CACHE).then(function(cache) {
     return cache.addAll([
        './',
        './favicon.ico',
        'assets/css/nike.css',
        'assets/images/just-do-it.svg',
        'assets/images/upload.svg',
        'assets/images/select.png',
        'assets/js/nike.min.js'
     ]);
   })
 );
});

// Trigger when every request is made, pull the request from the cache if it is available
self.addEventListener('fetch', function(event) {
  //console.log(event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// Delete old cache
self.addEventListener('activate', function(event) {
  var cacheKeeplist = [CACHE];

  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (cacheKeeplist.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );
});