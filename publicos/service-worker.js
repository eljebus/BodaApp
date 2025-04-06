const CACHE_NAME = 'boda-app-dev';
const VERSION = '1.0.0';

// URLs a cachear inmediatamente
const urlsToCache = [
    '/',
    '/index.html',
    '/css/materialize.css',
    '/css/style.css',
    '/js/materialize.js',
    '/js/fecha.js',
    '/js/instalar.js',
    '/img/luna.png',
    '/img/icon-192x192.png',
    '/img/girar.png',
    '/manifest.json'
];

// Forzar activación inmediata del service worker
self.addEventListener('install', event => {
    console.log('[Service Worker] Instalando versión:', VERSION);
    // Forzar activación inmediata
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cacheando recursos iniciales');
                return cache.addAll(urlsToCache);
            })
    );
});

// Limpiar caches antiguos y manejar activación
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activando versión:', VERSION);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Asegurar que el service worker tome control inmediatamente
            return self.clients.claim();
        })
    );
});

// Estrategia de caché: Network First con actualización automática
self.addEventListener('fetch', event => {
    // Ignorar solicitudes que no son GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignorar solicitudes de extensiones de Chrome
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    // Para desarrollo, siempre intentar primero la red
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Solo cachear respuestas exitosas
                if (response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            console.log('[Service Worker] Actualizando caché:', event.request.url);
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red, intentar servir desde caché
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            console.log('[Service Worker] Sirviendo desde caché:', event.request.url);
                            return response;
                        }
                        // Si no está en caché, devolver error 503
                        return new Response('Servicio no disponible', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Manejar notificaciones push
self.addEventListener('push', event => {
    console.log('[Service Worker] Push recibido');
    
    const options = {
        body: event.data.text(),
        icon: '/img/icon-192x192.png',
        badge: '/img/luna.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver más',
                icon: '/img/luna.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Boda Fátima y Jesús', options)
    );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notificación clickeada');
    
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});