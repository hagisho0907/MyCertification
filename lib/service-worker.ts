'use client'

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      
      console.log('[SW] Service Worker registered successfully:', registration.scope)
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New service worker available')
              // Optionally notify user about update
            }
          })
        }
      })
      
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error)
    }
  })
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister()
    console.log('[SW] Service Worker unregistered')
  })
}

// Send data to service worker for caching
export function cacheProgressData(data: any) {
  if (typeof window === 'undefined' || !navigator.serviceWorker.controller) {
    return
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_PROGRESS',
    data: data,
  })
}