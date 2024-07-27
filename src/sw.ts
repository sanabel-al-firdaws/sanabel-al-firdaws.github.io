import { NavigationRoute, registerRoute } from 'workbox-routing'
import {  clientsClaim, setCacheNameDetails } from 'workbox-core'
import {  createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import {offlineFallback, pageCache} from 'workbox-recipes';
declare let self: ServiceWorkerGlobalScope
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import {BackgroundSyncPlugin} from 'workbox-background-sync'
//SET VERSION
// const version = Date.now();
// const staticCacheName = version + 'staticfiles';

//INSTALL
// self.addEventListener('active', function(event) {
//   event.waitUntil(
//     caches.open('pages').then(function(cache) {
//       console.log(cache);
//         return cache.addAll([]);
//     }
//   )
// )
// });


precacheAndRoute([{url:'/404',revision: null}])
offlineFallback({pageFallback: '/offline',});
pageCache({
    warmCache: ['/','/theme','/intro'],
    cacheName: 'pages',
    plugins: [{cacheKeyWillBeUsed},
            new CacheableResponsePlugin({
                statuses: [ 200],
              }),
            new ExpirationPlugin({
              maxAgeSeconds: 60 * 60 * 24 * 365 
            }),

})

async function cacheKeyWillBeUsed({request, mode}) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) {
            return url.origin + url.pathname;
    }
    else {
        return url.origin + url.pathname + '/';
    }
  }

precacheAndRoute(self.__WB_MANIFEST, {directoryIndex: 'index.html',cleanURLs: true, ignoreURLParametersMatching: [/.*/] })
registerRoute(new NavigationRoute(createHandlerBoundToURL('/404')))

self.skipWaiting()
clientsClaim()