const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export class BaseApiService {
  protected static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const text = await response.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text)
  }

  protected static async get<T>(endpoint: string): Promise<T> {
    // Add cache busting to force fresh data
    const separator = endpoint.includes('?') ? '&' : '?';
    const cacheBustedEndpoint = `${endpoint}${separator}_cb=${Date.now()}`;
    return this.request<T>(cacheBustedEndpoint, { method: 'GET' })
  }

  protected static async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  protected static async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  protected static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}