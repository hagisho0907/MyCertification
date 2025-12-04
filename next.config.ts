import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: '/api/progress',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ]
  },
}

export default nextConfig