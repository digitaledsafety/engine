const swUrl = new URL(self.location.href);
const params = swUrl.searchParams;
const scopeTitle = params.get('title');
const scopeDesc = params.get('desc');
const scopeIcon = params.get('icon');
const scopePath = params.get('scope');

const title = scopeTitle || 'Engine';
const desc = scopeDesc || 'An open-source, block-based 3D coding environment.';
const icon = scopeIcon || '/assets/icons/gamepad-2.svg';
const startUrl = scopePath ? (scopePath + '?mode=app&fullscreen=true') : '/?mode=app&fullscreen=true';

const CACHE_NAME = 'engine-cache-v1';
const criticalUrls = [
  '/',
  '/manifest.json',
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
  self.skipWaiting();
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

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Intercept manifest.json requests under the scope
  if (url.pathname.endsWith('manifest.json')) {
    const manifest = {
      "name": title,
      "short_name": title,
      "description": desc,
      "start_url": startUrl,
      "display": "fullscreen",
      "background_color": "#ffffff",
      "theme_color": "#007bff",
      "icons": [
        {
          "src": icon,
          "sizes": "any",
          "type": icon.endsWith('.svg') ? "image/svg+xml" : "image/png"
        }
      ]
    };

    // Add standard icons if using default or if we want fallbacks
    if (icon === "/assets/icons/gamepad-2.svg") {
      manifest.icons.push(
        { "src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
      );
    }

    event.respondWith(
      new Response(JSON.stringify(manifest), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }

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
