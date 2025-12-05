// ===== SERVICE WORKER INTELIGENTE v3 =====
// Atualiza automaticamente quando há nova versão no GitHub Pages

const CACHE_NAME = 'eventos-local-v3';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './img/logo.png'
];

// ===== INSTALAÇÃO =====
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nova versão:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pré-carregando arquivos...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// ===== ATIVAÇÃO =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando nova versão e limpando antigas...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Excluindo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ===== FETCH (ONLINE FIRST, FALLBACK OFFLINE) =====
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cached) => cached || caches.match('./index.html'));
      })
  );
});

// ===== ATUALIZAÇÃO AUTOMÁTICA DETECTADA =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
    fetch('./manifest.json')
      .then((response) => response.text())
      .then((newManifest) => {
        caches.match('./manifest.json').then((oldCache) => {
          if (!oldCache) return;
          oldCache.text().then((oldManifest) => {
            if (newManifest !== oldManifest) {
              console.log('[SW] Nova versão detectada!');
              event.source.postMessage({ type: 'UPDATE_AVAILABLE' });
            }
          });
        });
      })
      .catch((err) => console.warn('[SW] Falha ao verificar atualização:', err));
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Atualização forçada...');
    self.skipWaiting();
  }
});
