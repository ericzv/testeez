/**
 * Image Optimization Module
 * - WebP support with PNG fallback
 * - Lazy loading for off-screen images
 * - Automatic format detection
 */

(function() {
    'use strict';

    // Detectar suporte a WebP
    let webpSupport = false;

    function detectWebPSupport() {
        return new Promise(resolve => {
            const webP = new Image();
            webP.onload = webP.onerror = function () {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    // Inicializar detecção
    detectWebPSupport().then(supported => {
        webpSupport = supported;
        console.log(`WebP support: ${supported ? 'YES' : 'NO'}`);

        // Se WebP é suportado, substituir imagens PNG por WebP
        if (webpSupport) {
            replaceWithWebP();
        }
    });

    /**
     * Substitui imagens PNG por WebP onde disponível
     */
    function replaceWithWebP() {
        // Processar todas as imagens PNG
        const images = document.querySelectorAll('img[src$=".png"]');

        images.forEach(img => {
            const pngSrc = img.src;
            const webpSrc = pngSrc.replace(/\.png$/, '.webp');

            // Testar se WebP existe
            const testImg = new Image();
            testImg.onload = function() {
                // WebP existe, usar ela
                img.src = webpSrc;
                console.log(`Switched to WebP: ${webpSrc}`);
            };
            testImg.onerror = function() {
                // WebP não existe, manter PNG
                console.log(`WebP not found, keeping PNG: ${pngSrc}`);
            };
            testImg.src = webpSrc;
        });

        // Processar backgrounds em CSS
        const elements = document.querySelectorAll('[style*="background-image"]');
        elements.forEach(el => {
            const style = el.style.backgroundImage;
            if (style && style.includes('.png')) {
                const webpStyle = style.replace(/\.png/g, '.webp');
                // Testar se existe
                const url = webpStyle.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                if (url) {
                    fetch(url, { method: 'HEAD' })
                        .then(response => {
                            if (response.ok) {
                                el.style.backgroundImage = webpStyle;
                            }
                        })
                        .catch(() => {
                            // Manter PNG
                        });
                }
            }
        });
    }

    /**
     * Lazy loading com Intersection Observer
     */
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;

                        // Carregar imagem
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }

                        // Parar de observar
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px' // Começar a carregar 50px antes de entrar na viewport
            });

            // Observar todas as imagens com data-src
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback: carregar todas as imagens imediatamente
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }

    /**
     * Pré-carregar imagens críticas
     */
    function preloadCriticalImages(urls) {
        if (!Array.isArray(urls)) return;

        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        });
    }

    /**
     * Otimizar renderização de sprites
     */
    function optimizeSpriteRendering() {
        const sprites = document.querySelectorAll('.character-sprite-layer, .boss-sprite, .boss-sprite-idle');
        sprites.forEach(sprite => {
            // Adicionar image-rendering para sprites pixel art
            sprite.style.imageRendering = 'pixelated';
            sprite.style.imageRendering = '-moz-crisp-edges';
            sprite.style.imageRendering = '-webkit-optimize-contrast';
        });
    }

    // Exportar funções globalmente
    window.ImageOptimizer = {
        detectWebPSupport,
        replaceWithWebP,
        initLazyLoading,
        preloadCriticalImages,
        optimizeSpriteRendering,
        webpSupport: () => webpSupport
    };

    // Auto-inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initLazyLoading();
            optimizeSpriteRendering();
        });
    } else {
        initLazyLoading();
        optimizeSpriteRendering();
    }

})();
