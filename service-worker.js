const CACHE_NAME = "lottery-cache-v55";

const ASSETS = [
  "./",
  "./index.html?v=54",
  "./style.css?v=54",
  "./app.js?v=54",
  "./manifest.json?v=54",
  "./latest.json",
  "./favicon.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch((err) => {
        console.warn("SW install cache failed:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 只處理同網域資源
  if (url.origin !== location.origin) return;

  // JSON 走網路優先，避免資料卡住
  if (
    url.pathname.endsWith("/latest.json") ||
    url.pathname.endsWith("latest.json") ||
    url.pathname.endsWith("539_api.json")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 其他靜態檔走快取優先
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match("./index.html?v=54"));
    })
  );
});