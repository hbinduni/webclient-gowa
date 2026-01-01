import type {
  ApiResponse,
  ClientsResponse,
  LoginRequest,
  LoginResponse,
  QRLoginResponse,
  RefreshResponse,
  SendMessageRequest,
  SendMessageResponse,
} from './types'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken()
      if (refreshed) {
        // Retry the request
        return this.request<T>(endpoint, options)
      }
      // Redirect to login
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Request failed')
    }

    return data
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    return response.data!
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {method: 'POST'})
  }

  async refreshToken(): Promise<boolean> {
    try {
      await this.request<ApiResponse<RefreshResponse>>('/auth/refresh', {
        method: 'POST',
      })
      return true
    } catch {
      return false
    }
  }

  // Admin endpoints
  async getClients(): Promise<ClientsResponse> {
    const response = await this.request<ApiResponse<ClientsResponse>>('/admin/clients')
    return response.results!
  }

  // WhatsApp endpoints
  async getQRCode(phone: string): Promise<QRLoginResponse> {
    const response = await this.request<ApiResponse<QRLoginResponse>>(`/api/${phone}/app/login`)
    return response.results!
  }

  async logoutClient(phone: string): Promise<void> {
    await this.request(`/api/${phone}/app/logout`)
  }

  async sendMessage(phone: string, data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await this.request<ApiResponse<SendMessageResponse>>(`/api/${phone}/send/message`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.results!
  }
}

export const api = new ApiClient()
