/*
 * Service Worker: macht die Home-Bildschirm-App offline spielbar.
 * Strategie: Seite (HTML) zuerst aus dem Netz (Updates kommen an), Assets aus dem Cache.
 * Bei neuen Versionen CACHE erhöhen.
 */
// v2: Aufnahmeprüfung (neue Sprites), neues App-Icon
// v3: neue Zauber-Effekte (Tornado, Windspeer, Blitze, Feuer, Wasser, Erde), alte Caches aufräumen
// v4: neue 3D-Fassung unter ./3d/ (Standard), Seiten werden je Adresse zwischengespeichert
// v5: Grimoire-System Etappe A (vier Fähigkeiten, Ultimate, Verwandlung, Spielstand Version 3), alte Dateien aufräumen
const CACHE = 'clover-quest-v6';
const CORE = ['./', './index.html', './3d/', './3d/index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Seiten: zuerst aus dem Netz (Updates kommen an), offline die zuletzt geladene Fassung derselben Adresse
    const url = new URL(req.url);
    const key = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(() => caches.match(key).then((hit) => hit || caches.match('./3d/index.html')).then((hit) => hit || caches.match('./index.html'))),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
