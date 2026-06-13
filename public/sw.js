// Service Worker para ADDANI - Web Push Notifications
// Se registra cuando el usuario entra a la tienda

const CACHE_VERSION = 'addani-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Recibir notificación push del servidor
self.addEventListener('push', (event) => {
  let data = { title: 'ADDANI', body: 'Nueva actualización', url: '/' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'addani-update',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.url ? [
      { action: 'open', title: 'Ver detalle' },
    ] : undefined,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en la notificación → abrir el link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
