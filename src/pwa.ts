import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import { clientsClaim } from 'workbox-core'
import { setCatchHandler } from 'workbox-routing';
import { setDefaultHandler } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope
const urls =["/offline.html","/index.html","/theme.html","/intro.html"];
const strategy = new StaleWhileRevalidate({
  cacheName: 'pages',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    // new BrodcastUpdatePlugin ()
    new BroadcastUpdatePlugin({
     headersToCheck: ['Last-Modified']
    }),
    
  ] 
})

const pageFallback = '/offline.html';
setDefaultHandler(new NetworkOnly());

self.addEventListener('install', event => {
  const files = [pageFallback];
  // handleAll returns two promises, the second resolves after all items have been added to cache.
  const done = urls.map(
    path =>
      strategy.handleAll({
        event,
        request: new Request(path),
      })[1]
  );

  event.waitUntil(Promise.all(done));


  event.waitUntil(
    self.caches
      .open('workbox-offline-fallbacks')
      .then(cache => cache.addAll(files))
  );
});

const handler = async (options: { request: { destination: any; }; }) => {
  const dest = options.request.destination;
  const cache = await self.caches.open('workbox-offline-fallbacks');

  if (dest === 'document') {
    return (await cache.match(pageFallback)) || Response.error();
  }


  return Response.error();
};

setCatchHandler(handler);

registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    // JavaScript
    request.destination === 'script' ||
    // Web Workers
    request.destination === 'worker' ||
    request.destination === 'font'
    ,
 
  new StaleWhileRevalidate({
    cacheName: 'static',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      // new BrodcastUpdatePlugin ()
      new BroadcastUpdatePlugin({
       headersToCheck: ['Last-Modified']
      }),
      
    ] 


})

);
registerRoute(
  ({ request }) =>
    request.mode === 'navigate' 
  ,
 
  new StaleWhileRevalidate({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      // new BrodcastUpdatePlugin ()
      new BroadcastUpdatePlugin({
       headersToCheck: ['Last-Modified']
      }),
      
    ] 


}));



// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated

self.skipWaiting()
clientsClaim()
