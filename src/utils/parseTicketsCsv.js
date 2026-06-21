/**
 * Parsea filas CSV respetando comillas (descripciones con comas).
 */
function parseCsvRows(text) {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    const next = cleaned[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }

  return rows;
}

function mapTicketRow(cols, indices) {
  const { descIdx, nameIdx, contactIdx } = indices;
  return {
    descripcion: (cols[descIdx] ?? '').trim(),
    nombre_cliente: (cols[nameIdx] ?? 'Desconocido').trim() || 'Desconocido',
    contacto_cliente: (cols[contactIdx] ?? '').trim(),
  };
}

export function parseTicketsCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = header.some(
    (h) => h.includes('descripcion') || h.includes('description') || h.includes('nombre')
  );

  let descIdx = 0;
  let nameIdx = 1;
  let contactIdx = 2;

  if (hasHeader) {
    descIdx = header.findIndex((h) => h.includes('descripcion') || h.includes('description'));
    nameIdx = header.findIndex((h) => h.includes('nombre'));
    contactIdx = header.findIndex(
      (h) => h.includes('contacto') || h.includes('email') || h.includes('correo')
    );
    if (descIdx === -1) descIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (contactIdx === -1) contactIdx = 2;
  }

  const indices = { descIdx, nameIdx, contactIdx };
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((cols) => mapTicketRow(cols, indices))
    .filter((t) => t.descripcion.length >= 5);
}

export function parseTicketsFile(text, filename = '') {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.json')) {
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed?.tickets;
    if (!Array.isArray(list)) return [];

    return list
      .map((item) => ({
        descripcion: String(item.descripcion ?? item.description ?? '').trim(),
        nombre_cliente: String(item.nombre_cliente ?? item.nombre ?? 'Desconocido').trim() || 'Desconocido',
        contacto_cliente: String(item.contacto_cliente ?? item.contacto ?? '').trim(),
      }))
      .filter((t) => t.descripcion.length >= 5);
  }

  return parseTicketsCsv(text);
}
