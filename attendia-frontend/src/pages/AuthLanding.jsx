import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUsuario, registrarAdmin } from '../api/endpoints';
import { ThemeToggle } from '../components/ThemeToggle';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1725784254011-cd5ec8f506a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhYnN0cmFjdCUyMHRlY2glMjBncmVlbnxlbnwxfHx8fDE3ODE5ODQwMzV8MA&ixlib=rb-4.1.0&q=80&w=1080';

export default function AuthLanding() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('join');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    tenant_id: '',
    nombre_empresa: '',
    correo: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await loginUsuario({
      tenant_id: formData.tenant_id,
      correo: formData.correo,
      password: formData.password,
    });

    setLoading(false);

    if (res.ok) {
      login(res.data);
      navigate(res.data.rol === 'admin' ? '/admin' : '/employee');
    } else {
      setError(res.message || 'Credenciales inválidas');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const generatedTenantId = formData.nombre_empresa.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!generatedTenantId) {
      setLoading(false);
      setError('El nombre de la empresa debe incluir al menos una letra o número');
      return;
    }

    const res = await registrarAdmin({
      tenant_id: generatedTenantId,
      correo: formData.correo,
      password: formData.password,
      nombre_empresa: formData.nombre_empresa,
      areas: [],
    });

    setLoading(false);

    if (res.ok) {
      setSuccess('¡Empresa registrada! Ya puedes iniciar sesión.');
      setActiveTab('login');
      setFormData({ ...formData, tenant_id: generatedTenantId, password: '' });
    } else {
      setError(res.message || 'Error al registrar la empresa');
    }
  };

  const inputClass =
    'w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] transition-all';

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row selection:bg-[#4ADE80] selection:text-black">

      {/* Left: Hero */}
      <div className="hidden md:flex md:w-1/2 relative bg-muted border-r border-border overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        >
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#4ADE80] flex items-center justify-center shadow-lg shadow-[#4ADE80]/20">
              <Bot className="text-black" size={28} />
            </div>
            <span className="font-bold text-3xl tracking-tight">AttendIA</span>
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Soporte inteligente para{' '}
              <span className="text-[#4ADE80]">empresas modernas</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-md">
              Centraliza el soporte de tu equipo, automatiza respuestas y mejora la satisfacción de tus clientes en un entorno diseñado para la velocidad.
            </p>
          </div>

          <div className="text-sm text-gray-400">© 2026 AttendIA Inc. Todos los derechos reservados.</div>
        </div>
      </div>

      {/* Right: Auth panel */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-background">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-[#4ADE80] flex items-center justify-center">
              <Bot className="text-black" size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight">AttendIA</span>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden backdrop-blur-md">
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => { setActiveTab('join'); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'join' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Únete a nosotros
                {activeTab === 'join' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4ADE80] mx-8 rounded-t-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'login' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Iniciar Sesión
                {activeTab === 'login' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4ADE80] mx-8 rounded-t-full" />
                )}
              </button>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-5 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  {success}
                </div>
              )}

              {activeTab === 'join' ? (
                <form onSubmit={handleJoin} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Nombre de la Empresa</label>
                    <input
                      type="text"
                      name="nombre_empresa"
                      required
                      value={formData.nombre_empresa}
                      onChange={handleChange}
                      placeholder="Acme Corp"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Correo del Administrador</label>
                    <input
                      type="email"
                      name="correo"
                      required
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="admin@tuempresa.com"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Crea una contraseña segura"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full bg-[#4ADE80] hover:bg-[#A8E6CF] text-black font-semibold rounded-lg px-4 py-3 transition-all duration-300 shadow-[0_0_10px_rgba(74,222,128,0.1)] hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Crear mi espacio de trabajo'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">ID de Empresa</label>
                    <input
                      type="text"
                      name="tenant_id"
                      required
                      value={formData.tenant_id}
                      onChange={handleChange}
                      placeholder="ej: acmecorp"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Correo corporativo</label>
                    <input
                      type="email"
                      name="correo"
                      required
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="empleado@tuempresa.com"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Contraseña</label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-lg px-4 py-3 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar a mi bandeja'}
                  </button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Admin y empleados usan el mismo inicio de sesión. Serás redirigido según tu rol.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
