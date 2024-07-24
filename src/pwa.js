import {registerRoute} from 'workbox-routing';
import {NetworkFirst} from 'workbox-strategies';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core'
import {setCatchHandler} from 'workbox-routing';
const pageFallback = 'index.html';

self.addEventListener('install', event => {
  const files = [pageFallback];


  event.waitUntil(
    self.caches
      .open('workbox-offline-fallbacks')
      .then(cache => cache.addAll(files))
  );
});

const handler = async options => {
  const dest = options.request.destination;
  const cache = await self.caches.open('workbox-offline-fallbacks');

  if (dest === 'document') {
    return (await cache.match(pageFallback)) || Response.error();
  }


  return Response.error();
};

setCatchHandler(handler);


registerRoute(
  ({request}) => request.mode === 'navigate' ,
  new NetworkFirst({
    networkTimeoutSeconds: 3,
    cacheName:'pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);


registerRoute(
  ({request}) =>
    // CSS
    request.destination === 'style' ||
    // JavaScript
    request.destination === 'script' ||
    request.destination === 'font' ||
    // Web Workers
    request.destination === 'worker',
  new NetworkFirst({
    cacheName: 'static-resources' ,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);
// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated

self.skipWaiting()
clientsClaim()