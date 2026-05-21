const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => request<any>('/auth/me'),
  },
  incidents: {
    list: (params?: { status?: string; severity?: string; assignee?: string }) => {
      const filteredParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== '')
      );
      const query = new URLSearchParams(filteredParams).toString();
      return request<any[]>(`/incidents${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<any>(`/incidents/${id}`),
    create: (data: any) =>
      request<any>('/incidents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    stats: () => request<any>('/incidents/stats'),
    addActivity: (id: string, data: any) =>
      request<any>(`/incidents/${id}/activities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  users: {
    list: () => request<any[]>('/users'),
  },
};