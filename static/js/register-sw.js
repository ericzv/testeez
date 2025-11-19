/**
 * Service Worker Registration
 * Registra o service worker para cache offline
 */

(function() {
    'use strict';

    // Verificar se Service Workers são suportados
    if (!('serviceWorker' in navigator)) {
        console.warn('[SW] Service Workers not supported');
        return;
    }

    // Registrar Service Worker
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/static/service-worker.js', {
                scope: '/'
            });

            console.log('[SW] Service Worker registered:', registration.scope);

            // Verificar updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[SW] Update found, installing new version...');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nova versão disponível
                        console.log('[SW] New version installed, reload to update');

                        // Opcional: mostrar notificação ao usuário
                        if (window.showUpdateNotification) {
                            window.showUpdateNotification();
                        }
                    }
                });
            });

            // Verificar por updates periodicamente (a cada 1 hora)
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

        } catch (error) {
            console.error('[SW] Service Worker registration failed:', error);
        }
    });

    // Ouvir mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from Service Worker:', event.data);
    });

    // Função para forçar atualização
    window.updateServiceWorker = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
            console.log('[SW] Update check completed');
        }
    };

    // Função para limpar cache
    window.clearCache = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
            registration.active.postMessage({ type: 'CLEAR_CACHE' });
            console.log('[SW] Cache clear requested');
        }
    };

    // Status do cache
    window.getCacheStatus = async () => {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log('[SW] Active caches:', cacheNames);

            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const keys = await cache.keys();
                console.log(`[SW] Cache "${cacheName}":`, keys.length, 'items');
            }
        }
    };

})();
