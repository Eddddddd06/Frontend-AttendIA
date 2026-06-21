import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, X, CheckCircle2, Bot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { obtenerTickets, resolverTicket } from '../api/endpoints';
import { extractTicketList } from '../utils/normalizeTicket';
import { buildTenantArea, ticketBelongsToEmployeeArea, mergeUniqueTickets } from '../utils/areas';
import { ThemeToggle } from '../components/ThemeToggle';

function getUrgencyFromScore(score) {
  const value = Number(score) || 0;
  if (value >= 80) return 'alta';
  if (value >= 50) return 'media';
  return 'baja';
}

function getUrgencyColor(urgency) {
  if (urgency === 'alta') return 'bg-red-500';
  if (urgency === 'media') return 'bg-yellow-500';
  return 'bg-slate-400 dark:bg-[#808080]';
}

function getUrgencyLabel(urgency) {
  if (urgency === 'alta') return 'Urgencia Alta';
  if (urgency === 'media') return 'Urgencia Media';
  return 'Urgencia Baja';
}

function formatDate(iso) {
  if (!iso) return 'Fecha desconocida';
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const initials = (user?.correo?.substring(0, 2) || 'ES').toUpperCase();

  useEffect(() => {
    async function loadTickets() {
      if (!user?.tenant_id || !user?.area?.trim()) {
        setLoading(false);
        return;
      }

      const tenantArea = buildTenantArea(user.tenant_id, user.area);
      let list = [];

      // Intento 1: filtro por tenant_area (formato: empresa#Soporte)
      const byArea = await obtenerTickets({ tenant_area: tenantArea });
      if (byArea.ok) {
        list = extractTicketList(byArea, user.tenant_id).filter((t) =>
          ticketBelongsToEmployeeArea(t, user)
        );
      }

      // Intento 2: todos del tenant + filtro client-side (fallback si GET por área falla)
      const byTenant = await obtenerTickets({ tenant_id: user.tenant_id });
      if (byTenant.ok) {
        const filtered = extractTicketList(byTenant, user.tenant_id).filter((t) =>
          ticketBelongsToEmployeeArea(t, user)
        );
        list = mergeUniqueTickets(list, filtered);
      }

      setTickets(list);
      setLoading(false);
    }
    loadTickets();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setIsResolving(false);
    setResolutionText('');
  };

  const handleResolve = async () => {
    if (!isResolving) {
      setIsResolving(true);
      return;
    }

    setActionLoading(true);
    const res = await resolverTicket(selectedTicket.ticket_id, selectedTicket.tenant_id);
    setActionLoading(false);

    if (res.ok) {
      setTickets(tickets.filter((t) => t.ticket_id !== selectedTicket.ticket_id));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4ADE80', '#A8E6CF', '#ffffff'],
      });
      closeModal();
    } else {
      alert(res.message || 'Error al resolver el ticket');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#4ADE80] selection:text-black">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4ADE80] flex items-center justify-center shadow-sm">
            <Bot className="text-black" size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">AttendIA</span>
          <span className="text-muted-foreground mx-2 hidden sm:block">|</span>
          <div className="font-medium text-sm">Bandeja — {user?.area}</div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-muted rounded-full p-1 pr-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                <span className="text-sm font-medium">{initials}</span>
              </div>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl py-1 z-10">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium truncate">{user?.correo}</p>
                  <p className="text-xs text-muted-foreground">Área: {user?.area}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <LogOut size={14} /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-8">
          Bandeja de Entrada — {user?.area}
          {!loading && <span className="text-muted-foreground text-lg font-normal ml-2">({tickets.length})</span>}
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
            {tickets.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                  <CheckCircle2 size={32} className="text-[#4ADE80]" />
                </div>
                <p className="text-lg font-medium">¡Todo al día!</p>
                <p className="text-muted-foreground text-sm mt-1">No hay tickets pendientes en tu bandeja.</p>
              </div>
            ) : (
              tickets.map((ticket, idx) => {
                const urgency = getUrgencyFromScore(ticket.score);
                const descripcion = ticket.descripcion || 'Sin descripción';
                const subject = descripcion.length > 60
                  ? `${descripcion.substring(0, 60)}...`
                  : descripcion;

                return (
                  <div
                    key={ticket.ticket_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedTicket(ticket); setIsResolving(false); setResolutionText(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedTicket(ticket)}
                    className={`relative flex items-center gap-4 p-4 sm:px-6 cursor-pointer group transition-colors duration-200 ${idx !== tickets.length - 1 ? 'border-b border-border' : ''} hover:bg-muted/50`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 opacity-80 group-hover:opacity-100 group-hover:w-1.5 transition-all">
                      <div className={`h-full w-full ${getUrgencyColor(urgency)}`} />
                    </div>

                    <div className="flex-1 min-w-0 pl-2">
                      <h3 className="text-base font-semibold truncate group-hover:text-[#4ADE80] transition-colors">
                        {subject}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="truncate">{ticket.nombre_cliente}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="whitespace-nowrap">{formatDate(ticket.creado_en)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {selectedTicket && (() => {
        const urgency = getUrgencyFromScore(selectedTicket.score);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded text-xs font-medium bg-muted border border-border flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getUrgencyColor(urgency)}`} />
                    {getUrgencyLabel(urgency)} — {selectedTicket.score}/100
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">{selectedTicket.ticket_id}</span>
                </div>
                <button type="button" onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <h2 className="text-2xl font-bold mb-2 leading-tight">Detalle del Reporte</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  De: <span className="text-foreground">{selectedTicket.nombre_cliente}</span>
                  {selectedTicket.contacto_cliente && (
                    <span className="text-muted-foreground"> ({selectedTicket.contacto_cliente})</span>
                  )}
                </p>

                <div className={`text-base leading-relaxed bg-muted p-5 rounded-xl border border-border transition-all duration-300 ${isResolving ? 'max-h-32 overflow-y-auto text-sm opacity-80' : ''}`}>
                  {selectedTicket.descripcion || 'Sin descripción disponible'}
                </div>

                {isResolving && (
                  <div className="mt-6">
                    <label className="block text-sm mb-2 font-medium">Escribe la respuesta para el cliente...</label>
                    <textarea
                      autoFocus
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      rows={5}
                      placeholder="Detalla cómo se solucionó el problema..."
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] transition-colors resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border bg-muted/30 rounded-b-2xl shrink-0 flex justify-end gap-3">
                {!isResolving ? (
                  <button
                    type="button"
                    onClick={() => setIsResolving(true)}
                    className="border border-[#4ADE80] text-[#4ADE80] hover:bg-[#4ADE80]/10 font-medium rounded-lg px-6 py-2.5 transition-colors text-sm"
                  >
                    Resolver Ticket
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsResolving(false)}
                      className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleResolve}
                      disabled={!resolutionText.trim() || actionLoading}
                      className="bg-[#4ADE80] hover:bg-[#A8E6CF] disabled:opacity-50 text-black font-medium rounded-lg px-6 py-2.5 transition-colors text-sm shadow-[0_0_10px_rgba(74,222,128,0.1)] flex items-center gap-2"
                    >
                      {actionLoading ? (
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Marcar como Resuelto'
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
