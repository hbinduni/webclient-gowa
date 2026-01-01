// Configuration for WhatsApp Web API Client

interface Config {
  API_URL: string
  WS_URL: string
  APP_NAME: string
  APP_VERSION: string
}

function getConfig(): Config {
  const isProduction = import.meta.env.PROD
  const apiUrl = import.meta.env.VITE_API_URL || ''

  // In development, Vite proxy handles API calls to /api, /auth, etc.
  // In production, configure VITE_API_URL to point to the Go backend
  return {
    API_URL: apiUrl,
    WS_URL: isProduction ? apiUrl.replace(/^http/, 'ws') : `ws://${window.location.host}`,
    APP_NAME: 'WhatsApp Web API',
    APP_VERSION: 'v1.0.0',
  }
}

export const config = getConfig()
