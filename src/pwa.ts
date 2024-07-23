import {registerRoute} from 'workbox-routing';
import {NetworkFirst} from 'workbox-strategies';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {staticResourceCache} from 'workbox-recipes';

staticResourceCache();

const cacheName = 'pages';
//@ts-ignore
const matchCallback = ({request}) => request.mode === 'navigate';
const networkTimeoutSeconds = 3;

registerRoute(
  matchCallback,
  new NetworkFirst({
    networkTimeoutSeconds,
    cacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);


