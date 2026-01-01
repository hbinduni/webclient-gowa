// API Response types
export interface ApiResponse<T> {
  code: number | string
  message: string
  data?: T
  results?: T
}

// Auth types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  expires_at: string
  token_type: string
}

export interface RefreshResponse {
  access_token: string
  expires_at: string
  token_type: string
}

// Client types
export interface ClientStatus {
  phone: string
  status: string
  is_connected: boolean
  is_logged_in: boolean
  device_id: string
  last_activity: string
}

export interface ClientsResponse {
  client_count: number
  clients: Record<string, ClientStatus>
}

// QR Login response
export interface QRLoginResponse {
  qr_link: string
  qr_duration: number
}

// Send message types
export interface SendMessageRequest {
  phone: string
  message: string
}

export interface SendMessageResponse {
  message_id: string
  status: string
}

// WebSocket event types
export interface WSEvent {
  code: string
  phone?: string[]
  message?: string
  data?: unknown
}
