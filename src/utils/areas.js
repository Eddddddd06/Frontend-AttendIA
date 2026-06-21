export function buildTenantArea(tenantId, area) {
  const tid = String(tenantId ?? '').trim();
  const ar = String(area ?? '').trim();
  if (!tid || !ar) return '';
  return `${tid}#${ar}`;
}

export function normalizeAreaName(area) {
  return String(area ?? '').trim().toLowerCase();
}

export function ticketBelongsToEmployeeArea(ticket, user) {
  if (!user?.tenant_id || !user?.area) return false;

  const employeeKey = buildTenantArea(user.tenant_id, user.area).toLowerCase();
  const ticketKey = String(
    ticket.tenant_area || buildTenantArea(ticket.tenant_id, ticket.area)
  ).toLowerCase();

  return (
    ticketKey === employeeKey
    || normalizeAreaName(ticket.area) === normalizeAreaName(user.area)
  );
}

export function mergeUniqueTickets(...lists) {
  const map = new Map();
  lists.flat().forEach((ticket) => {
    if (ticket?.ticket_id) map.set(ticket.ticket_id, ticket);
  });
  return [...map.values()].sort((a, b) => b.score - a.score);
}
