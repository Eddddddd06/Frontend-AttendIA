// Cambia esta URL cuando se despliegue un nuevo API Gateway
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  || 'https://9mj1ymr1hi.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Helper para manejar ambas integraciones de API Gateway:
 * - Lambda Proxy: HTTP status real, body es el JSON directo
 * - Lambda Integration: HTTP 200 siempre, statusCode dentro del body
 */
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('attendia_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: token }),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    return { ok: false, statusCode: 0, message: 'No se pudo conectar con el servidor' };
  }

  let raw;
  try {
    raw = await response.json();
  } catch {
    return { ok: false, statusCode: response.status, message: 'Respuesta inválida del servidor' };
  }

  // Lambda Integration: respuesta viene como { statusCode, body: "JSON string" }
  if (raw.statusCode !== undefined && typeof raw.body === 'string') {
    try {
      const parsed = JSON.parse(raw.body);
      return { ok: raw.statusCode >= 200 && raw.statusCode < 300, statusCode: raw.statusCode, ...parsed };
    } catch {
      return { ok: false, statusCode: raw.statusCode, message: raw.body };
    }
  }

  // Lambda Proxy: respuesta directa
  if (raw.statusCode !== undefined) {
    return { ok: raw.statusCode >= 200 && raw.statusCode < 300, ...raw };
  }

  return { ok: response.ok, statusCode: response.status, ...raw };
}

// ─── AUTH ─────────────────────────────────────────────────

export async function registrarAdmin({ tenant_id, correo, password, nombre_empresa, areas }) {
  return apiCall('/auth/usuarios', {
    method: 'POST',
    body: JSON.stringify({ tenant_id, correo, password, nombre_empresa, rol: 'admin', areas: areas || [] }),
  });
}

export async function registrarEmpleado({ correo, password, area }) {
  return apiCall('/auth/usuarios', {
    method: 'POST',
    body: JSON.stringify({ correo, password, area, rol: 'empleado' }),
  });
}

export async function loginUsuario({ tenant_id, correo, password }) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ tenant_id, correo, password }),
  });
}

export async function logoutUsuario() {
  return apiCall('/auth/logout', { method: 'POST' });
}

export async function validarToken() {
  return apiCall('/auth/validar', { method: 'POST' });
}

export async function actualizarAreas(areas) {
  return apiCall('/auth/empresas/areas', {
    method: 'PUT',
    body: JSON.stringify({ areas }),
  });
}

export async function obtenerEmpleados() {
  return apiCall('/auth/empleados', { method: 'GET' });
}

// ─── TICKETS ──────────────────────────────────────────────

export async function crearTicketPublico({ tenant_id, descripcion, nombre, contacto }) {
  return apiCall('/tickets', {
    method: 'POST',
    body: JSON.stringify({ tenant_id, descripcion, nombre, contacto }),
  });
}

export async function cargarTicketsCSV({ tenant_id, tickets }) {
  return apiCall('/tickets/csv', {
    method: 'POST',
    body: JSON.stringify({ tenant_id, tickets }),
  });
}

export async function obtenerTickets({ tenant_area, tenant_id }) {
  const parts = [];
  if (tenant_area) {
    parts.push(`tenant_area=${encodeURIComponent(tenant_area)}`);
  } else if (tenant_id) {
    parts.push(`tenant_id=${encodeURIComponent(tenant_id)}`);
  }
  const qs = parts.length ? `?${parts.join('&')}` : '';
  return apiCall(`/tickets${qs}`, { method: 'GET' });
}

export async function resolverTicket(ticket_id, tenant_id) {
  return apiCall(`/tickets/${encodeURIComponent(ticket_id)}/resolver`, {
    method: 'PUT',
    body: JSON.stringify({ tenant_id }),
  });
}

export { BASE_URL };
