/**
 * Cliente HTTP personalizado con soporte nativo de Cookies y Sesiones (credentials: 'include')
 */

const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    ...(options.headers || {})
  };

  // Si no es FormData, agregamos Content-Type application/json por defecto
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Crucial: Permite enviar y recibir la cookie 'rutabol.sid' de sesión
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Error en la solicitud HTTP (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  postForm: (endpoint, formData) => apiRequest(endpoint, {
    method: 'POST',
    body: formData
  }),
  put: (endpoint, body) => apiRequest(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};
