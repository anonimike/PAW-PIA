import { useState } from 'react';
import './shared.css'; // Mismos estilos base

export default function Login({ onLogin }) {
  const [usuario, setUsuario]   = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar en sessionStorage para mantener la sesión
      sessionStorage.setItem('pos_user', JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '32px 32px 40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: '#fff'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2L18 3l-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
              <path d="M16 16H8M16 12H8M10 8H8"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Carnicería y Abarrotes "Lupita"</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'var(--danger-light)', color: 'var(--danger)',
              padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20,
              display: 'flex', gap: 8, alignItems: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              className="input"
              type="text"
              placeholder="Ej. mtorres"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: 44, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Autenticando…</> : 'Entrar al Sistema'}
          </button>
        </form>

      </div>
    </div>
  );
}
