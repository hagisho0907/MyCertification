// Service Worker for Progress Cache Management
const CACHE_NAME = 'mycert-progress-v1'
const PROGRESS_API_URL = '/api/progress'

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')
  event.waitUntil(self.clients.claim())
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Handle progress API requests
  if (url.pathname === PROGRESS_API_URL) {
    if (event.request.method === 'GET') {
      // For GET requests, try cache first then network
      event.respondWith(handleProgressGet(event.request))
    } else if (event.request.method === 'PUT') {
      // For PUT requests, always go to network and update cache
      event.respondWith(handleProgressPut(event.request))
    }
  }
})

async function handleProgressGet(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, networkResponse.clone())
      console.log('[SW] Progress data fetched from network and cached')
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error)
  }

  // Fallback to cache
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    console.log('[SW] Progress data served from cache')
    return cachedResponse
  }

  // If no cache, return empty progress
  console.log('[SW] No cached data, returning empty progress')
  return new Response(JSON.stringify({ exams: {} }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  })
}

async function handleProgressPut(request) {
  try {
    // Always try network first for PUT
    const networkResponse = await fetch(request.clone())
    
    if (networkResponse.ok) {
      // Update cache with successful PUT
      console.log('[SW] Progress updated successfully, updating cache')
      
      // Create a GET request to cache the updated data
      const getRequest = new Request(request.url, { method: 'GET' })
      const getResponse = await fetch(getRequest)
      
      if (getResponse.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(getRequest, getResponse.clone())
      }
      
      return networkResponse
    } else {
      console.log('[SW] Progress PUT failed:', networkResponse.status)
      return networkResponse
    }
  } catch (error) {
    console.log('[SW] Progress PUT network error:', error)
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    })
  }
}

// Message handling for manual cache updates
self.addEventListener('message', async (event) => {
  if (event.data.type === 'CACHE_PROGRESS') {
    const cache = await caches.open(CACHE_NAME)
    const request = new Request(PROGRESS_API_URL)
    const response = new Response(JSON.stringify(event.data.data), {
      headers: { 'Content-Type': 'application/json' }
    })
    await cache.put(request, response)
    console.log('[SW] Progress data cached manually')
  }
})