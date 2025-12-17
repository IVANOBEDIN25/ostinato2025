const CACHE_VERSION = "vRESET1"; // ← НОВОЕ ИМЯ
const CACHE_NAME = `ostinato-cache-${CACHE_VERSION}`;

// Обязательная оболочка приложения (app shell)
const CORE_ASSETS = [
  "./",                 // важно: /ostinato2025/ (запуск из иконки часто идёт сюда)
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/app.js",
];

// Иконки — не должны ломать установку, если какая-то отсутствует
const OPTIONAL_ASSETS = [
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-16.png",
  "./icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Кэшируем критические файлы: если что-то из этого не доступно — лучше не ставить SW
    await cache.addAll(CORE_ASSETS);

    // Иконки кэшируем «мягко»
    for (const url of OPTIONAL_ASSETS) {
      try {
        await cache.add(url);
      } catch (_) {
        // игнорируем ошибки (например 404)
      }
    }
  })());

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Только GET и только свой origin
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Навигация (запуск приложения/переходы)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      // В оффлайне отдаём оболочку
      const cachedShell =
        (await cache.match("./index.html")) ||
        (await cache.match("./"));

      // Если сеть есть — пробуем обновить index в фоне
      const networkPromise = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) cache.put("./index.html", resp.clone());
          return resp;
        })
        .catch(() => null);

      event.waitUntil(networkPromise);

      return cachedShell || (await networkPromise) || Response.error();
    })());
    return;
  }

  // Остальная статика: cache-first + тихое обновление
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);

    if (cached) {
      event.waitUntil(
        fetch(req)
          .then((resp) => {
            if (resp && resp.ok) cache.put(req, resp.clone());
          })
          .catch(() => {})
      );
      return cached;
    }

    try {
      const resp = await fetch(req);
      if (resp && resp.ok) cache.put(req, resp.clone());
      return resp;
    } catch {
      return Response.error();
    }
  })());
});
