import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout      from './components/Layout';
import Login       from './pages/Login';
import Ventas      from './pages/Ventas';
import Almacen     from './pages/Almacen';
import Proveedores from './pages/Proveedores';
import Empleados   from './pages/Empleados';
import Facturas    from './pages/Facturas';
import './pages/shared.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('pos_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { /* ignore */ }
    }
    setLoading(false);
  }, []);

  if (loading) return null; // Or a spinner

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // RBAC simple route guard
  const isEmployee = user.rol === 'Empleado';

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={() => { sessionStorage.removeItem('pos_user'); setUser(null); }} />}>
          <Route index element={<Ventas />} />
          
          {/* Protected Routes - Only Gerente or Admin */}
          {!isEmployee && (
            <>
              <Route path="almacen" element={<Almacen />} />
              <Route path="proveedores" element={<Proveedores />} />
              <Route path="empleados" element={<Empleados />} />
              <Route path="facturas" element={<Facturas />} />
            </>
          )}

          {/* Fallback for unauthorized access */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
