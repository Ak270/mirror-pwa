const CACHE_NAME = 'mirror-v1'
const OFFLINE_URLS = ['/', '/dashboard', '/log', '/habits', '/graphs']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/manifest.json',
        '/icons/icon-192.svg',
      ]).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Network-first for API and auth routes
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return
  }

  // Cache-first for static assets
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => cached ?? fetch(event.request))
    )
    return
  }

  // Network-first with offline fallback for app pages
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'Time to check in',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'mirror-notification',
    data: data.data || data,
    actions: data.actions || [],
    renotify: data.renotify || false,
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Mirror', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/log'
  
  // Handle action buttons
  if (event.action === 'done') {
    // TODO: Could POST to /api/habits/checkin with API token from notification data
    // For now, just open to log page
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen))
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
    )
  } else {
    // Default action or 'open' action
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen))
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
    )
  }
})

// Widget event handlers for Android PWA widgets
self.addEventListener('widgetinstall', (event) => {
  console.log('Widget installed:', event.widget)
})

self.addEventListener('widgetuninstall', (event) => {
  console.log('Widget uninstalled:', event.widget)
})

self.addEventListener('widgetresume', (event) => {
  console.log('Widget resumed:', event.widget)
  // Widget data will be fetched from /api/habits/widget automatically
})
