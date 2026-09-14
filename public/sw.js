// Brifix Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: '🚀 Brifix AI Top Stock Pick',
    body: 'New high-confidence market opportunity identified.',
    icon: '/brifix-logo.png',
    badge: '/brifix-logo.png',
    data: { url: '/predictions' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/brifix-logo.png',
    badge: payload.badge || '/brifix-logo.png',
    vibrate: [200, 100, 200],
    tag: payload.tag || 'ai-stock-pick',
    renotify: true,
    requireInteraction: true,
    data: payload.data || { url: '/predictions' },
    actions: [
      { action: 'open', title: '📈 View Recommendation' },
      { action: 'dismiss', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/predictions';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
