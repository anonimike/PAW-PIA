import { useState, useEffect, useCallback } from 'react';
import './Facturas.css';

const API = 'http://localhost:3001/api';

// ── Íconos ───────────────────────────────────────────────────
function IconReceipt() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9"  x2="8" y2="9"/>
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function fmt(n)    { return `$${Number(n).toFixed(2)}`; }
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Modal de Detalle ─────────────────────────────────────────
function DetalleModal({ factura, onClose }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!factura) return;
    setLoading(true);
    fetch(`${API}/facturas/${factura.id}/detalle`)
      .then(r => r.json())
      .then(data => { setDetalle(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [factura]);

  if (!factura) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Factura #{String(factura.id).padStart(6, '0')}</h2>
            <p className="modal-sub">{fmtDate(factura.fecha)} · Atendido por: <strong style={{ color: 'var(--text-primary)' }}>{factura.nombre_empleado ?? 'Empleado no disponible'}</strong></p>
          </div>
          <button className="btn-icon" onClick={onClose}><IconClose /></button>
        </div>

        {/* Detalle tabla */}
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">Cargando desglose…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cód.</th>
                  <th style={{ textAlign: 'right' }}>P. Unit.</th>
                  <th style={{ textAlign: 'center' }}>Cant.</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(detalle ?? []).map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500 }}>{d.producto_nombre}</td>
                    <td>
                      <code style={{ fontSize: 11, background: 'var(--bg)', padding: '1px 7px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                        {d.codigo}
                      </code>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.precio_unitario)}</td>
                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>×{d.cantidad}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totales del modal */}
        <div className="modal-footer">
          <div className="modal-totals">
            <div className="mf-row mf-total"><span>Total</span><span>{fmt(factura.total)}</span></div>
          </div>
          <div className="mf-meta">
            <span className="badge badge-success">{factura.metodo_pago}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────
export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('todo');  // todo | hoy | semana
  const [busquedaId,  setBusquedaId]  = useState('');
  const [selected,    setSelected]    = useState(null);

  const cargarFacturas = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filtroFecha !== 'todo') params.set('fecha', filtroFecha);
    if (busquedaId.trim())      params.set('id', busquedaId.trim());

    fetch(`${API}/facturas?${params}`)
      .then(r => { if (!r.ok) throw new Error('Error del servidor'); return r.json(); })
      .then(data => { setFacturas(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [filtroFecha, busquedaId]);

  useEffect(() => { cargarFacturas(); }, [cargarFacturas]);

  const totalGeneral = facturas.reduce((s, f) => s + f.total, 0);

  return (
    <div className="page">
      {/* Encabezado */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Facturas</h1>
          <p>Historial de ventas · {facturas.length} registros · Total: {fmt(totalGeneral)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="facturas-filtros card">
        <IconFilter />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Filtrar por</span>

        <div className="filtro-chips">
          {[['todo','Todos'],['hoy','Hoy'],['semana','Última semana']].map(([val, label]) => (
            <button
              key={val}
              className={`chip${filtroFecha === val ? ' chip-active' : ''}`}
              onClick={() => { setFiltroFecha(val); setBusquedaId(''); }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="filtro-sep" />

        <input
          className="input filtro-id"
          placeholder="Buscar por ID…"
          value={busquedaId}
          onChange={e => { setBusquedaId(e.target.value.replace(/\D/, '')); setFiltroFecha('todo'); }}
          maxLength={8}
          type="text"
          inputMode="numeric"
        />
      </div>

      {/* Tabla */}
      <div className="card" style={{ marginTop: 16 }}>
        {error ? (
          <div className="facturas-estado error">
            ⚠ {error} — ¿El servidor está corriendo en el puerto 3001?
          </div>
        ) : loading ? (
          <div className="facturas-estado">Cargando facturas…</div>
        ) : facturas.length === 0 ? (
          <div className="facturas-estado muted">No se encontraron facturas para el filtro seleccionado.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha y hora</th>
                  <th>Empleado</th>
                  <th>Método</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {facturas.map(f => (
                  <tr key={f.id} className="factura-row" onClick={() => setSelected(f)}>
                    <td>
                      <span className="factura-id">#{String(f.id).padStart(6, '0')}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtDate(f.fecha)}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {f.nombre_empleado ?? <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Empleado no disponible</span>}
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>{f.metodo_pago}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(f.total)}
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>
                        <IconReceipt /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <DetalleModal factura={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
