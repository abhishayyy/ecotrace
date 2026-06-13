// EcoTrace — Service Worker
// Provides offline support by caching static assets.

const CACHE_NAME = "ecotrace-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/style.css",
  "/calculations.js",
  "/emissions-factors.js",
  "/badges.js",
  "/ai-insights.js",
  "/manifest.json",
  "/public/icon-192.png",
  "/public/icon-512.png",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
];

// Install: cache all static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET and cross-origin API requests
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("api.anthropic.com")) return;
  if (event.request.url.includes("firestore.googleapis.com")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful responses for static assets
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => {
        // Return cached index.html for navigation requests when offline
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
