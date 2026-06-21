import { buildTenantArea } from './areas';

export function normalizeTicket(raw, fallbackTenantId = '') {
  if (!raw || typeof raw !== 'object') return null;

  const descripcion = String(
    raw.descripcion ?? raw['Descripción'] ?? raw.Descripcion ?? raw.description ?? ''
  ).trim();
  if (!descripcion) return null;

  const ticketId = raw.ticket_id ?? raw.id;
  if (!ticketId) return null;

  const estado = String(raw.estado ?? 'pendiente');
  if (estado.toLowerCase() === 'resuelto') return null;

  const area = String(raw.area ?? raw.Area ?? '');

  return {
    ticket_id: String(ticketId),
    tenant_id: String(raw.tenant_id ?? raw.Tenant_Id ?? fallbackTenantId ?? ''),
    descripcion,
    nombre_cliente: String(raw.nombre_cliente ?? raw.Nombre ?? raw.nombre ?? 'Sin nombre'),
    contacto_cliente: String(raw.contacto_cliente ?? raw.Contacto ?? raw.contacto ?? ''),
    score: Number(raw.score ?? 0) || 0,
    estado,
    area,
    tenant_area: String(
      raw.tenant_area
      || buildTenantArea(raw.tenant_id ?? raw.Tenant_Id ?? fallbackTenantId, area)
    ),
    creado_en: raw.creado_en ?? raw.clasificado_en ?? new Date().toISOString(),
  };
}

export function extractTicketList(response, fallbackTenantId = '') {
  const rawList = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.tickets)
      ? response.tickets
      : [];

  return rawList
    .map((item) => normalizeTicket(item, fallbackTenantId))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}
