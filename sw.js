const CACHE_NAME = 'engine-cache-v1';
const criticalUrls = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icons/gamepad-2.svg'
];

const externalUrls = [
  'https://cdn.digitaleducationsafety.org/packages/babylon.js@8.36.1/babylon.js',
  'https://cdn.digitaleducationsafety.org/packages/babylon.js@8.36.1/babylon.gui.min.js',
  'https://cdn.digitaleducationsafety.org/packages/babylon.js@8.36.1/babylonjs.loaders.min.js',
  'https://cdn.digitaleducationsafety.org/packages/babylon-vrm-loader@2.0.0/index.min.js',
  'https://cdn.digitaleducationsafety.org/packages/earcut@2.2.4/earcut.min.js',
  'https://cdn.digitaleducationsafety.org/packages/blockly@12.3.1/blockly_compressed.js',
  'https://cdn.digitaleducationsafety.org/packages/blockly@12.3.1/blocks_compressed.js',
  'https://cdn.digitaleducationsafety.org/packages/blockly@12.3.1/javascript_compressed.js',
  'https://cdn.digitaleducationsafety.org/packages/blockly@12.3.1/en.js',
  'https://cdn.digitaleducationsafety.org/packages/@blockly/field-colour@6.0.6/index.js',
  'https://cdn.digitaleducationsafety.org/packages/cannon@0.6.2/cannon.min.js',
  'https://cdn.digitaleducationsafety.org/packages/nipplejs@0.10.2/nipplejs.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        // Cache critical local assets; installation fails if these are missing
        await cache.addAll(criticalUrls);

        // Cache external assets individually; failure won't block installation
        return Promise.allSettled(
          externalUrls.map(url =>
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy for HTML pages (including workspaces)
  if (event.request.mode === 'navigate') {
    // If running tests/localhost, we bypass service worker caching for navigation to prevent page-load hangs
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return; // Fall back to native browser retrieval
    }
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
          );
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default strategy for assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(fetchRes => {
          // Cache icons and other common assets as they are discovered
          if (url.origin === location.origin && (url.pathname.includes('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg'))) {
             const copy = fetchRes.clone();
             event.waitUntil(
               caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))
             );
          }
          return fetchRes;
        });
      })
  );
});
