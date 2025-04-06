const CACHE_NAME = 'boda-app-dev';
const VERSION = '1.0.0';

// URLs a cachear inmediatamente
const urlsToCache = [
    '/',
    '/index.html',
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
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Cacheando recursos iniciales');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Error al cachear:', error);
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
        }).catch(error => {
            console.error('[Service Worker] Error al activar:', error);
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
                        })
                        .catch(error => {
                            console.error('[Service Worker] Error al actualizar el caché:', error);
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

// Manejo de notificaciones push
self.addEventListener('push', function(event) {
    console.log('Evento push recibido:', event);

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('Datos de la notificación:', data);

            if (!data.title || !data.body) {
                throw new Error('Faltan datos necesarios para la notificación');
            }

            const options = {
                body: data.body,
                icon: data.icon || '/img/icon-192x192.png',
                badge: data.badge || '/img/luna.png',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1
                },
                actions: [
                    {
                        action: 'explore',
                        title: 'Ver más'
                    }
                ]
            };

            event.waitUntil(
                self.registration.showNotification(data.title, options)
            );
        } catch (error) {
            console.error('Error en la notificación push:', error);
        }
    }
});

// Manejo de clics en las notificaciones
self.addEventListener('notificationclick', function(event) {
    console.log('Notificación clickeada:', event);
    
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/explore') // Redirigir a una página específica si se clickea "explore"
        );
    } else {
        event.waitUntil(
            clients.openWindow('/') // Redirigir a la página principal en caso contrario
        );
    }
});
