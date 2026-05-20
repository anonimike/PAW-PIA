/**
 * EmpleadoModal.jsx — Modal reutilizable para Añadir / Modificar empleado
 */
import { useState, useEffect, useRef } from 'react';

const ROLES = ['Empleado', 'Gerente', 'Admin'];

const EMPTY = {
  usuario:  '',
  password: '',
  nombre:   '',
  rol:      'Empleado',
  telefono: '',
  email:    '',
  horario:  '',
  salario:  '',
  estado:   'Activo',
};

export default function EmpleadoModal({ open, onClose, onSaved, empleado }) {
  const isEdit = Boolean(empleado);
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const firstRef = useRef(null);

  const API = 'http://localhost:3001/api';

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(isEdit ? {
      usuario:  empleado.usuario  ?? '',
      password: '', // Blank by default when editing, so we don't send anything unless changed
      nombre:   empleado.nombre   ?? '',
      rol:      empleado.rol      ?? 'Empleado',
      telefono: empleado.telefono ?? '',
      email:    empleado.email    ?? '',
      horario:  empleado.horario  ?? '',
      salario:  empleado.salario  ?? '',
      estado:   empleado.estado   ?? 'Activo',
    } : EMPTY);
    setTimeout(() => firstRef.current?.focus(), 80);
  }, [open, empleado]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre del empleado es obligatorio.'); return; }
    if (!form.usuario.trim()) { setError('El usuario (login) es obligatorio.'); return; }
    if (!isEdit && !form.password) { setError('La contraseña es obligatoria al crear empleado.'); return; }
    
    // Parsear salario a float, o usar 0
    const salarioVal = parseFloat(form.salario) || 0;
    const payload = { ...form, salario: salarioVal };

    setSaving(true); setError('');
    try {
      const url    = isEdit ? `${API}/empleados/${empleado.id}` : `${API}/empleados`;
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      
      onSaved({ ...payload, id: isEdit ? empleado.id : data.id });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="pm-emp-title"
           style={{ width: 'min(540px, calc(100vw - 32px))' }}>

        {/* Header */}
        <div className="modal-header">
          <h2 id="pm-emp-title" className="modal-title">
            {isEdit ? 'Modificar Empleado' : 'Añadir Empleado'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {error && (
              <div className="modal-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className="modal-grid">
              {/* Nombre empleado */}
              <div className="form-group modal-col-2">
                <label className="form-label" htmlFor="em-nombre">Nombre completo <span className="req">*</span></label>
                <input id="em-nombre" ref={firstRef} className="input" type="text"
                       name="nombre" placeholder="Ej. Miguel Ángel Torres" value={form.nombre} onChange={handle} autoComplete="off" />
              </div>

              {/* Usuario */}
              <div className="form-group">
                <label className="form-label" htmlFor="em-usuario">Usuario (Login) <span className="req">*</span></label>
                <input id="em-usuario" className="input" type="text"
                       name="usuario" placeholder="Ej. mtorres" value={form.usuario} onChange={handle} autoComplete="off" />
              </div>

              {/* Contraseña */}
              <div className="form-group">
                <label className="form-label" htmlFor="em-password">Contraseña {isEdit ? '(Opcional)' : <span className="req">*</span>}</label>
                <input id="em-password" className="input" type="password"
                       name="password" placeholder={isEdit ? "Dejar en blanco para no cambiar" : "••••••••"} value={form.password} onChange={handle} autoComplete="new-password" />
              </div>

              {/* Rol */}
              <div className="form-group">
                <label className="form-label" htmlFor="em-rol">Rol</label>
                <select id="em-rol" className="input" name="rol" value={form.rol} onChange={handle}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Horario */}
              <div className="form-group">
                <label className="form-label" htmlFor="em-horario">Horario</label>
                <input id="em-horario" className="input" type="text"
                       name="horario" placeholder="Ej. Lun–Vie 8–16h" value={form.horario} onChange={handle} autoComplete="off" />
              </div>

              {/* Salario */}
              <div className="form-group">
                <label className="form-label" htmlFor="em-salario">Sueldo mensual ($)</label>
                <input id="em-salario" className="input" type="number" step="100"
                       name="salario" placeholder="0" value={form.salario} onChange={handle} />
              </div>

              {/* Teléfono */}
              <div className="form-group">
                <label className="form-label" htmlFor="em-telefono">Teléfono</label>
                <input id="em-telefono" className="input" type="tel"
                       name="telefono" placeholder="618-..." value={form.telefono} onChange={handle} />
              </div>

              {/* Email (ocupa 2 columnas) */}
              <div className="form-group modal-col-2">
                <label className="form-label" htmlFor="em-email">Correo electrónico</label>
                <input id="em-email" className="input" type="email"
                       name="email" placeholder="correo@ejemplo.com" value={form.email} onChange={handle} />
              </div>

              {/* Estado — Siempre visible para cambiar a Vacaciones o Inactivo fácilmente */}
              <div className="form-group modal-col-2">
                <label className="form-label">Estado del empleado</label>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  {['Activo', 'Vacaciones', 'Inactivo'].map(st => (
                    <label key={st} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="estado" 
                        value={st} 
                        checked={form.estado === st} 
                        onChange={handle} 
                        style={{ accentColor: st === 'Activo' ? 'var(--success)' : st === 'Vacaciones' ? 'var(--warning)' : 'var(--danger)' }}
                      />
                      <span style={{ fontSize: 13.5, color: form.estado === st ? 'var(--text-primary)' : 'var(--text-muted)' }}>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Guardando…</> : isEdit ? 'Guardar cambios' : 'Añadir empleado'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
