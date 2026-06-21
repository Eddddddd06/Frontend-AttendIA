import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLanding from './pages/AuthLanding';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return user.rol === 'admin'
      ? <Navigate to="/admin" replace />
      : <Navigate to="/employee" replace />;
  }

  return <AuthLanding />;
}

import { useRouteError, Link } from 'react-router-dom';

function RouteError() {
  const error = useRouteError();
  const message = error?.message || 'Ocurrió un error inesperado';

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <Link to="/" className="text-[#4ADE80] hover:underline text-sm">Volver al inicio</Link>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
    errorElement: <RouteError />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/employee',
    element: (
      <ProtectedRoute requiredRole="empleado">
        <EmployeeDashboard />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
  },
]);
