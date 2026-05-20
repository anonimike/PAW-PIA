/**
 * ProductoModal.jsx — Modal reutilizable para Agregar / Editar producto
 * Props:
 *   open      : boolean
 *   onClose   : () => void
 *   onSaved   : (producto) => void   — callback tras guardar exitosamente
 *   producto  : object | null        — null = modo agregar, objeto = modo editar
 */
import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3001/api';

const EMPTY = {
  nombre:       '',
  codigo:       '',
  proveedor_id: '',
  stock_actual: '',
  stock_minimo: '',
  precio_venta: '',
  unidad:       'pza',
};

export default function ProductoModal({ open, onClose, onSaved, producto }) {
  const isEdit = Boolean(producto);

  const [form,       setForm]       = useState(EMPTY);
  const [proveedores, setProveedores] = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const firstInputRef = useRef(null);

  /* ── Cargar proveedores una sola vez ── */
  useEffect(() => {
    fetch(`${API}/proveedores`)
      .then(r => r.json())
      .then(data => setProveedores(data.filter(p => p.estado === 'Activo')))
      .catch(() => {});
  }, []);

  /* ── Precargar datos al abrir en modo editar ── */
  useEffect(() => {
    if (!open) return;
    setError('');
    if (isEdit) {
      setForm({
        nombre:       producto.nombre      ?? '',
        codigo:       producto.codigo      ?? '',
        proveedor_id: producto.proveedor_id ?? '',
        stock_actual: producto.stock_actual ?? '',
        stock_minimo: producto.stock_minimo ?? '',
        precio_venta: producto.precio_venta ?? '',
        unidad:       producto.unidad       ?? 'pza',
      });
    } else {
      setForm(EMPTY);
    }
    // Focus al primer input con pequeño delay para que el modal esté visible
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [open, producto]);

  /* ── Cerrar con Escape ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.nombre.trim())          return 'El nombre es obligatorio.';
    if (!/^\d{4}$/.test(form.codigo)) return 'El código debe tener exactamente 4 dígitos.';
    if (form.stock_actual === '')      return 'El stock inicial es obligatorio.';
    if (form.stock_minimo === '')      return 'El stock mínimo es obligatorio.';
    if (form.precio_venta === '' || Number(form.precio_venta) <= 0)
                                       return 'El precio debe ser mayor a 0.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError('');

    const payload = {
      nombre:       form.nombre.trim(),
      codigo:       form.codigo.trim(),
      proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
      precio_venta: Number(form.precio_venta),
      precio_costo: 0,
      unidad:       form.unidad,
    };

    try {
      const url    = isEdit ? `${API}/productos/${producto.id}` : `${API}/productos`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }

      const data = await res.json();
      // Construir objeto enriquecido para actualizar la tabla en tiempo real
      const proveedor = proveedores.find(p => p.id === (payload.proveedor_id));
      onSaved({
        id:            isEdit ? producto.id : data.id,
        nombre:        payload.nombre,
        codigo:        payload.codigo,
        proveedor_id:  payload.proveedor_id,
        proveedor_nombre: proveedor?.nombre ?? null,
        stock_actual:  payload.stock_actual,
        stock_minimo:  payload.stock_minimo,
        precio_venta:  payload.precio_venta,
        unidad:        payload.unidad,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {isEdit ? 'Editar Producto' : 'Agregar Producto'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">

            {/* Error banner */}
            {error && (
              <div className="modal-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className="modal-grid">
              {/* Nombre */}
              <div className="form-group modal-col-2">
                <label className="form-label" htmlFor="pm-nombre">Nombre del producto <span className="req">*</span></label>
                <input
                  id="pm-nombre"
                  ref={firstInputRef}
                  className="input"
                  type="text"
                  name="nombre"
                  placeholder="Ej. Leche Entera 1L"
                  value={form.nombre}
                  onChange={handle}
                  autoComplete="off"
                />
              </div>

              {/* Código */}
              <div className="form-group">
                <label className="form-label" htmlFor="pm-codigo">
                  Código (4 dígitos) <span className="req">*</span>
                </label>
                <input
                  id="pm-codigo"
                  className="input"
                  type="text"
                  name="codigo"
                  placeholder="Ej. 1001"
                  maxLength={4}
                  value={form.codigo}
                  onChange={handle}
                  disabled={isEdit}            /* no se puede cambiar el código al editar */
                  style={isEdit ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                  autoComplete="off"
                />
                {isEdit && (
                  <span className="form-hint">El código no puede modificarse.</span>
                )}
              </div>

              {/* Proveedor */}
              <div className="form-group">
                <label className="form-label" htmlFor="pm-proveedor">Proveedor</label>
                <select
                  id="pm-proveedor"
                  className="input"
                  name="proveedor_id"
                  value={form.proveedor_id}
                  onChange={handle}
                >
                  <option value="">— Sin proveedor —</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div className="form-group">
                <label className="form-label" htmlFor="pm-precio">Precio de venta <span className="req">*</span></label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">$</span>
                  <input
                    id="pm-precio"
                    className="input input-prefixed"
                    type="number"
                    name="precio_venta"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.precio_venta}
                    onChange={handle}
                  />
                </div>
              </div>

              {/* Stock inicial */}
              <div className="form-group">
                <label className="form-label" htmlFor="pm-stock">
                  {isEdit ? 'Stock actual' : 'Stock inicial'} <span className="req">*</span>
                </label>
                <input
                  id="pm-stock"
                  className="input"
                  type="number"
                  name="stock_actual"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={form.stock_actual}
                  onChange={handle}
                />
              </div>

              {/* Stock mínimo */}
              <div className="form-group">
                <label className="form-label" htmlFor="pm-stock-min">Stock mínimo <span className="req">*</span></label>
                <input
                  id="pm-stock-min"
                  className="input"
                  type="number"
                  name="stock_minimo"
                  placeholder="5"
                  min="0"
                  step="1"
                  value={form.stock_minimo}
                  onChange={handle}
                />
              </div>

              {/* Unidad */}
              <div className="form-group">
                <label className="form-label" htmlFor="pm-unidad">Unidad</label>
                <select
                  id="pm-unidad"
                  className="input"
                  name="unidad"
                  value={form.unidad}
                  onChange={handle}
                >
                  <option value="pza">Pieza (pza)</option>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="lt">Litro (lt)</option>
                  <option value="caja">Caja</option>
                  <option value="bolsa">Bolsa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><span className="spinner" /> Guardando…</>
              ) : (
                isEdit ? 'Guardar cambios' : 'Agregar producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
