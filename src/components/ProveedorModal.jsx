/**
 * ProveedorModal.jsx — Modal reutilizable para Añadir / Modificar proveedor
 */
import { useState, useEffect, useRef } from 'react';

const CATEGORIAS = ['General', 'Lácteos', 'Panadería', 'Bebidas', 'Carnes', 'Frutas y Verduras', 'Limpieza', 'Abarrotes', 'Otro'];

const EMPTY = {
  nombre:    '',
  contacto:  '',
  telefono:  '',
  email:     '',
  direccion: '',
  categoria: 'General',
  estado:    'Activo',
};

export default function ProveedorModal({ open, onClose, onSaved, proveedor }) {
  const isEdit = Boolean(proveedor);
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const firstRef = useRef(null);

  const API = 'http://localhost:3001/api';

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(isEdit ? {
      nombre:    proveedor.nombre    ?? '',
      contacto:  proveedor.contacto  ?? '',
      telefono:  proveedor.telefono  ?? '',
      email:     proveedor.email     ?? '',
      direccion: proveedor.direccion ?? '',
      categoria: proveedor.categoria ?? 'General',
      estado:    proveedor.estado    ?? 'Activo',
    } : EMPTY);
    setTimeout(() => firstRef.current?.focus(), 80);
  }, [open, proveedor]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 'Activo' : 'Inactivo') : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre de la empresa es obligatorio.'); return; }
    setSaving(true); setError('');
    try {
      const url    = isEdit ? `${API}/proveedores/${proveedor.id}` : `${API}/proveedores`;
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      onSaved({ ...form, id: isEdit ? proveedor.id : data.id });
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
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="pm-prov-title"
           style={{ width: 'min(540px, calc(100vw - 32px))' }}>

        {/* Header */}
        <div className="modal-header">
          <h2 id="pm-prov-title" className="modal-title">
            {isEdit ? 'Modificar Proveedor' : 'Añadir Proveedor'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
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
              {/* Nombre empresa */}
              <div className="form-group modal-col-2">
                <label className="form-label" htmlFor="pv-nombre">Nombre de empresa <span className="req">*</span></label>
                <input id="pv-nombre" ref={firstRef} className="input" type="text"
                       name="nombre" placeholder="Ej. Grupo Lala" value={form.nombre} onChange={handle} autoComplete="off" />
              </div>

              {/* Contacto */}
              <div className="form-group">
                <label className="form-label" htmlFor="pv-contacto">Nombre del contacto</label>
                <input id="pv-contacto" className="input" type="text"
                       name="contacto" placeholder="Ej. Carlos Méndez" value={form.contacto} onChange={handle} autoComplete="off" />
              </div>

              {/* Teléfono */}
              <div className="form-group">
                <label className="form-label" htmlFor="pv-telefono">Teléfono</label>
                <input id="pv-telefono" className="input" type="tel"
                       name="telefono" placeholder="618-123-4567" value={form.telefono} onChange={handle} />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="pv-email">Correo electrónico</label>
                <input id="pv-email" className="input" type="email"
                       name="email" placeholder="contacto@empresa.com" value={form.email} onChange={handle} />
              </div>

              {/* Categoría */}
              <div className="form-group">
                <label className="form-label" htmlFor="pv-categoria">Categoría</label>
                <select id="pv-categoria" className="input" name="categoria" value={form.categoria} onChange={handle}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Dirección */}
              <div className="form-group modal-col-2">
                <label className="form-label" htmlFor="pv-direccion">Dirección</label>
                <input id="pv-direccion" className="input" type="text"
                       name="direccion" placeholder="Calle, Ciudad, Estado" value={form.direccion} onChange={handle} autoComplete="off" />
              </div>

              {/* Estado — solo en modo edición */}
              {isEdit && (
                <div className="form-group modal-col-2">
                  <label className="form-label">Estado del proveedor</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 2 }}>
                    <div className={`toggle-switch ${form.estado === 'Activo' ? 'on' : ''}`} onClick={() =>
                      setForm(prev => ({ ...prev, estado: prev.estado === 'Activo' ? 'Inactivo' : 'Activo' }))
                    }>
                      <div className="toggle-knob" />
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: form.estado === 'Activo' ? 'var(--success)' : 'var(--text-muted)' }}>
                      {form.estado}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Guardando…</> : isEdit ? 'Guardar cambios' : 'Añadir proveedor'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
