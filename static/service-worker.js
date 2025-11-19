/**
 * Service Worker - Cache Offline
 * Cacheia assets para carregamento instantâneo na segunda visita
 * Permite o jogo funcionar offline
 */

const CACHE_VERSION = 'game-cache-v1';
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

// Assets críticos que serão cacheados imediatamente
const CRITICAL_ASSETS = [
    '/static/css/battle.css',
    '/static/css/battle-turns.css',
    '/static/css/enemy-skills.css',
    '/static/js/performance-manager.js',
    '/static/js/image-optimizer.js',
    '/static/js/lazy-loader.js',
    '/static/js/lib/pixi.min.js',
    '/static/js/battle-base.js',
    '/static/js/battle-combat-system.js',
    '/static/js/battle-animation.js',
    '/static/js/battle-turns.js'
];

// Padrões de URLs para cachear
const CACHE_PATTERNS = {
    images: /\.(png|jpg|jpeg|gif|webp|svg)$/i,
    scripts: /\.js$/i,
    styles: /\.css$/i,
    fonts: /\.(woff|woff2|ttf|eot)$/i,
    static: /^\/static\//i
};

/**
 * Instalação - cachear assets críticos
 */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');

    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => {
                console.log('[ServiceWorker] Caching critical assets');
                return cache.addAll(CRITICAL_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Critical assets cached');
                return self.skipWaiting(); // Ativar imediatamente
            })
            .catch(err => {
                console.error('[ServiceWorker] Failed to cache:', err);
            })
    );
});

/**
 * Ativação - limpar caches antigos
 */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_VERSION) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Activated');
                return self.clients.claim(); // Controlar todas as páginas
            })
    );
});

/**
 * Fetch - estratégia de cache
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requisições não-GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar requisições de API
    if (url.pathname.startsWith('/gamification/') ||
        url.pathname.startsWith('/api/')) {
        return;
    }

    // Estratégia: Cache First para assets estáticos
    if (shouldCache(url.pathname)) {
        event.respondWith(cacheFirst(request));
    }
    // Estratégia: Network First para HTML
    else if (url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(networkFirst(request));
    }
});

/**
 * Verificar se deve cachear
 */
function shouldCache(pathname) {
    return CACHE_PATTERNS.static.test(pathname) ||
           CACHE_PATTERNS.images.test(pathname) ||
           CACHE_PATTERNS.scripts.test(pathname) ||
           CACHE_PATTERNS.styles.test(pathname) ||
           CACHE_PATTERNS.fonts.test(pathname);
}

/**
 * Estratégia: Cache First (usa cache, senão busca na rede)
 * Ideal para: imagens, CSS, JS
 */
async function cacheFirst(request) {
    try {
        // Buscar no cache primeiro
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            // Verificar se cache expirou
            const cacheTime = await getCacheTime(request.url);
            if (cacheTime && (Date.now() - cacheTime) < CACHE_EXPIRATION) {
                console.log('[ServiceWorker] Cache hit:', request.url);
                return cachedResponse;
            }
        }

        // Se não está no cache ou expirou, buscar na rede
        const networkResponse = await fetch(request);

        // Cachear resposta se foi bem sucedida
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, networkResponse.clone());
            await setCacheTime(request.url);
            console.log('[ServiceWorker] Cached:', request.url);
        }

        return networkResponse;

    } catch (error) {
        console.error('[ServiceWorker] Fetch failed:', error);

        // Tentar retornar do cache mesmo que expirado
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Se nada funcionar, retornar erro
        return new Response('Offline and no cache available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Estratégia: Network First (tenta rede, senão usa cache)
 * Ideal para: HTML, APIs
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;

    } catch (error) {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Armazenar timestamp do cache
 */
async function setCacheTime(url) {
    const cache = await caches.open(CACHE_VERSION + '-meta');
    const response = new Response(JSON.stringify({ time: Date.now() }));
    await cache.put(url + '-time', response);
}

/**
 * Obter timestamp do cache
 */
async function getCacheTime(url) {
    try {
        const cache = await caches.open(CACHE_VERSION + '-meta');
        const response = await cache.match(url + '-time');

        if (response) {
            const data = await response.json();
            return data.time;
        }
    } catch (error) {
        return null;
    }

    return null;
}

/**
 * Mensagens do cliente
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('[ServiceWorker] Service Worker script loaded');
