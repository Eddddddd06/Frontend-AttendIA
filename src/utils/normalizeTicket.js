export function normalizeTicket(raw, fallbackTenantId = '') {
  if (!raw || typeof raw !== 'object') return null;

  const descripcion = String(raw.descripcion ?? raw.description ?? '').trim();
  if (!descripcion) return null;

  const ticketId = raw.ticket_id ?? raw.id;
  if (!ticketId) return null;

  const estado = String(raw.estado ?? 'pendiente');
  if (estado.toLowerCase() === 'resuelto') return null;

  return {
    ticket_id: String(ticketId),
    tenant_id: String(raw.tenant_id ?? fallbackTenantId ?? ''),
    descripcion,
    nombre_cliente: String(raw.nombre_cliente ?? raw.nombre ?? 'Sin nombre'),
    contacto_cliente: String(raw.contacto_cliente ?? raw.contacto ?? ''),
    score: Number(raw.score ?? 0) || 0,
    estado,
    area: String(raw.area ?? ''),
    tenant_area: String(raw.tenant_area ?? ''),
    creado_en: raw.creado_en ?? new Date().toISOString(),
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
