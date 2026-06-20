import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Plus, User, LogOut, X, Upload, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registrarEmpleado, cargarTicketsCSV, actualizarAreas } from '../api/endpoints';
import { ThemeToggle } from '../components/ThemeToggle';

const DEFAULT_AREAS = ['Ventas', 'Soporte', 'Facturación'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const fileInputRef = useRef(null);

  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPass, setNewEmpPass] = useState('');
  const [newEmpArea, setNewEmpArea] = useState('Soporte');

  const areaOptions = [...new Set([...DEFAULT_AREAS, ...areas])];
  const initials = (user?.correo?.substring(0, 2) || 'AD').toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoadingAdd(true);
    setAddError('');

    const res = await registrarEmpleado({
      correo: newEmpEmail,
      password: newEmpPass,
      area: newEmpArea,
    });

    setLoadingAdd(false);

    if (res.ok) {
      const nuevasAreas = areas.includes(newEmpArea) ? areas : [...areas, newEmpArea];
      if (nuevasAreas.length > areas.length) {
        await actualizarAreas(nuevasAreas);
        setAreas(nuevasAreas);
      }

      setEmployees([
        ...employees,
        {
          id: Date.now().toString(),
          name: newEmpEmail.split('@')[0],
          email: newEmpEmail,
          area: newEmpArea,
          status: 'Activo',
        },
      ]);
      setIsModalOpen(false);
      setNewEmpEmail('');
      setNewEmpPass('');
    } else {
      setAddError(res.message || 'Error al registrar empleado');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingCsv(true);
    setCsvResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').filter((r) => r.trim());
        const tickets = rows.slice(1).map((row) => {
          const [descripcion, nombre_cliente, contacto_cliente] = row.split(',');
          return {
            descripcion: descripcion?.trim() || '',
            nombre_cliente: nombre_cliente?.trim() || 'Desconocido',
            contacto_cliente: contacto_cliente?.trim() || '',
          };
        }).filter((t) => t.descripcion.length >= 5);

        const res = await cargarTicketsCSV({ tenant_id: user.tenant_id, tickets });

        if (res.ok) {
          const encolados = res.resumen?.encolados ?? tickets.length;
          setCsvResult({ ok: true, msg: `Se enviaron ${encolados} tickets a procesamiento.` });
        } else {
          setCsvResult({ ok: false, msg: res.message || 'Error al procesar CSV' });
        }
      } catch {
        setCsvResult({ ok: false, msg: 'Error al leer el archivo CSV' });
      } finally {
        setLoadingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const inputClass =
    'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] transition-colors';

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#4ADE80] selection:text-black">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4ADE80] flex items-center justify-center shadow-sm">
            <Bot className="text-black" size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">AttendIA</span>
          <span className="text-muted-foreground mx-2 hidden sm:block">|</span>
          <div className="font-medium text-sm">{user?.nombre_empresa || 'Empresa'}</div>
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
                  <p className="text-xs text-muted-foreground">Rol: Administrador</p>
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

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold">Mi Equipo</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setIsCsvModalOpen(true); setCsvResult(null); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border text-sm"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Importar CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#4ADE80] hover:bg-[#A8E6CF] text-black font-medium rounded-lg px-4 py-2.5 flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(74,222,128,0.1)] text-sm"
            >
              <Plus size={18} /> Añadir Empleado
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground bg-muted/50">
                  <th className="px-6 py-4 font-medium">Empleado</th>
                  <th className="px-6 py-4 font-medium">Área Asignada</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{emp.name}</p>
                          <p className="text-muted-foreground text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{emp.area}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-medium border border-[#4ADE80]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                      No tienes empleados registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Añadir empleado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Añadir Empleado</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 flex flex-col gap-5">
              {addError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {addError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Correo del empleado</label>
                <input
                  type="email"
                  required
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Contraseña temporal</label>
                <input
                  type="password"
                  required
                  value={newEmpPass}
                  onChange={(e) => setNewEmpPass(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Asignar Área</label>
                <select
                  value={newEmpArea}
                  onChange={(e) => setNewEmpArea(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAdd}
                  className="bg-[#4ADE80] hover:bg-[#A8E6CF] text-black font-medium rounded-lg px-5 py-2.5 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingAdd ? <Loader2 size={16} className="animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Importar CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <Upload size={48} className="mx-auto text-[#4ADE80] mb-4" />
            <h2 className="text-xl font-bold mb-2">Importar Tickets Masivos</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sube un CSV con: <br />
              <code className="text-xs">descripcion, nombre_cliente, contacto_cliente</code>
            </p>

            {csvResult && (
              <div className={`p-3 rounded-lg text-sm mb-4 border ${csvResult.ok ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                {csvResult.msg}
              </div>
            )}

            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingCsv}
              className="w-full bg-muted border border-[#4ADE80]/30 hover:border-[#4ADE80] text-foreground font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loadingCsv ? <Loader2 size={18} className="animate-spin" /> : 'Seleccionar Archivo CSV'}
            </button>

            <button type="button" onClick={() => setIsCsvModalOpen(false)} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cerrar ventana
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
