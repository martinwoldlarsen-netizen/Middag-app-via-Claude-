// Service worker for Handleklar: appen åpner også uten nett (for eksempel med
// dårlig dekning i butikken). Lista og ukeplanen ligger allerede på telefonen.
//
// - Sider: nett først, ellers siste lagrede versjon av appen.
// - Appens filer (/_expo, /assets) har unike navn per versjon: lagres første gang.
// - API-kall, databasen og bilder fra andre nettsteder går alltid rett på nett.

const SHELL = 'handleklar-shell-v1';
const FILES = 'handleklar-files-v1';
const ENTRY = /\/_expo\/static\/js\/web\/entry-[^/]+\.js$/;

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then(cache => cache.addAll(['/', '/manifest.json', '/icon-192.png']))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== SHELL && key !== FILES).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function rememberFile(request, response) {
  const cache = await caches.open(FILES);
  // Bare siste versjon av appens hovedfil trengs. Eldre versjoner fjernes.
  if (ENTRY.test(new URL(request.url).pathname)) {
    for (const old of await cache.keys()) {
      if (ENTRY.test(new URL(old.url).pathname) && old.url !== request.url) await cache.delete(old);
    }
  }
  await cache.put(request, response);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL).then(cache => cache.put('/', copy));
          }
          return response;
        })
        .catch(async () => (await caches.match('/')) || Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith('/_expo/') || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        hit =>
          hit ||
          fetch(request).then(response => {
            if (response.ok) {
              const copy = response.clone();
              event.waitUntil(rememberFile(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
