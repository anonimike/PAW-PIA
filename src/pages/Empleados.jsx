import { useState, useEffect, useCallback } from 'react';
import EmpleadoModal from '../components/EmpleadoModal';
import './shared.css';

const API = 'http://localhost:3001/api';

/* ── Paleta de colores por rol ── */
const ROLE_COLOR = {
  Empleado: '#2563eb',
  Gerente: '#7c3aed',
  Admin: '#be185d'
};

/* ── Íconos ── */
function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconReceipt() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2L18 3l-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M16 16H8M16 12H8M10 8H8"/>
    </svg>
  );
}
function IconWarning() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/* ── Status Badge ── */
function statusBadge(s) {
  if (s === 'Activo')     return <span className="badge badge-success">{s}</span>;
  if (s === 'Vacaciones') return <span className="badge badge-warning">{s}</span>;
  return                         <span className="badge badge-danger">{s}</span>;
}

/* ── Tarjeta de empleado ── */
function EmpleadoCard({ emp, onEdit, onDelete }) {
  const color   = ROLE_COLOR[emp.rol] || '#6b7280';
  const initial = (emp.nombre ?? '?').charAt(0).toUpperCase();

  return (
    <div className="proveedor-card card" style={{ opacity: emp.estado === 'Inactivo' ? 0.72 : 1 }}>
      {/* Avatar */}
      <div className="prov-avatar" style={{ background: color + '18', color }}>
        {initial}
      </div>

      {/* Info */}
      <div className="prov-info">
        <div className="prov-name">{emp.nombre}</div>
        <div className="prov-meta">
          <span style={{ color, fontWeight: 600, fontSize: 12 }}>{emp.rol}</span>
          {emp.horario && <span className="prov-dot">·</span>}
          {emp.horario && (
            <>
              <IconClock />
              <span>{emp.horario}</span>
            </>
          )}
        </div>

        {/* Facturas asociadas (estadística) */}
        {emp.total_facturas > 0 && (
          <div className="prov-meta" style={{ marginTop: 4 }}>
            <IconReceipt />
            <span style={{ color: 'var(--accent)' }}>
              {emp.total_facturas} venta{emp.total_facturas !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {statusBadge(emp.estado)}
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            ${(emp.salario || 0).toLocaleString('es-MX')}/mes
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="prov-actions" style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: '5px 10px' }}
          onClick={() => onEdit(emp)}
          title="Modificar empleado"
        >
          <IconEdit /> Modificar
        </button>
        <button
          className="btn btn-danger"
          style={{ fontSize: 12, padding: '5px 10px' }}
          onClick={() => onDelete(emp)}
          title="Eliminar empleado"
        >
          <IconTrash /> Eliminar
        </button>
      </div>
    </div>
  );
}

/* ── Modal de confirmación de eliminación ── */
function ConfirmDeleteModal({ empleado, onConfirm, onCancel, deleting, blockError }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !deleting) onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel, deleting]);

  if (!empleado) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={!deleting ? onCancel : undefined} />
      <div className="modal-panel" role="alertdialog" aria-modal="true"
           style={{ width: 'min(440px, calc(100vw - 32px))' }}>
        <div style={{ padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: blockError ? 'var(--warning-light)' : 'var(--danger-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: blockError ? 'var(--warning)' : 'var(--danger)',
          }}>
            <IconWarning />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              {blockError ? 'No se puede eliminar' : 'Eliminar empleado'}
            </h2>
            {blockError ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {blockError}
              </p>
            ) : (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                ¿Eliminar a <strong style={{ color: 'var(--text-primary)' }}>"{empleado.nombre}"</strong>?
                <br />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Esta acción no se puede deshacer.
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          {blockError ? (
            <button className="btn btn-secondary" onClick={onCancel} style={{ minWidth: 110 }} autoFocus>
              Entendido
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onCancel} disabled={deleting} style={{ minWidth: 110 }} autoFocus>
                Cancelar
              </button>
              <button
                className="btn"
                onClick={onConfirm}
                disabled={deleting}
                style={{ minWidth: 110, background: 'var(--danger)', color: '#fff', border: 'none' }}
              >
                {deleting ? <><span className="spinner" /> Eliminando…</> : <><IconTrash /> Sí, eliminar</>}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════
   Página principal de Empleados
══════════════════════════════════════ */
export default function Empleados() {
  const [empleados,       setEmpleados]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [search,          setSearch]          = useState('');
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editTarget,      setEditTarget]      = useState(null);
  const [confirmTarget,   setConfirmTarget]   = useState(null);
  const [blockError,      setBlockError]      = useState('');
  const [deleting,        setDeleting]        = useState(false);
  const [filtroEstado,    setFiltroEstado]    = useState('Todos');

  /* ── Cargar empleados ── */
  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/empleados`)
      .then(r => { if (!r.ok) throw new Error('Error del servidor'); return r.json(); })
      .then(data => { setEmpleados(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Filtros ── */
  const filtered = empleados.filter(e => {
    const matchSearch = !search ||
      (e.nombre ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.rol ?? '').toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'Todos' || e.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  /* ── Stats ── */
  const activos = empleados.filter(e => e.estado === 'Activo').length;
  const nomina  = empleados.filter(e => e.estado !== 'Inactivo').reduce((sum, e) => sum + (e.salario || 0), 0);

  /* ── Modal Añadir/Modificar ── */
  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (e) => { setEditTarget(e);   setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSaved = (saved) => {
    setEmpleados(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      if (idx === -1) return [...prev, { ...saved, total_facturas: 0 }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...saved };
      return copy;
    });
  };

  /* ── Eliminar ── */
  const askDelete = (e) => { setBlockError(''); setConfirmTarget(e); };
  const cancelDelete = () => { if (!deleting) { setConfirmTarget(null); setBlockError(''); } };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/empleados/${confirmTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        // 409 = tiene facturas (ventas) → mostrar mensaje bloqueante
        setBlockError(data.error ?? 'No se puede eliminar este empleado.');
        return;
      }
      setEmpleados(prev => prev.filter(e => String(e.id) !== String(confirmTarget.id)));
      setConfirmTarget(null);
    } catch (err) {
      setBlockError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Empleados</h1>
          <p>Control de personal y nómina</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <IconPlus /> Añadir Empleado
        </button>
      </div>

      {/* Stats */}
      <div className="almacen-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card card">
          <span className="stat-value">{empleados.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card card" style={{ borderLeft: activos > 0 ? '3px solid var(--success)' : undefined }}>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{activos}</span>
          <span className="stat-label">Activos</span>
        </div>
        <div className="stat-card card">
          <span className="stat-value">${nomina.toLocaleString('es-MX')}</span>
          <span className="stat-label">Nómina Base/mes</span>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Buscar por nombre o rol..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        {['Todos', 'Activo', 'Vacaciones', 'Inactivo'].map(v => (
          <button
            key={v}
            className={`btn ${filtroEstado === v ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroEstado(v)}
            style={{ padding: '8px 14px' }}
          >
            {v}
          </button>
        ))}
        {search && (
          <button className="btn btn-secondary" onClick={() => setSearch('')} style={{ padding: '8px 12px' }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Grid de tarjetas */}
      {error ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--danger)', fontSize: 13 }}>
          ⚠ {error} — ¿El servidor está corriendo?
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: 13 }}>
          Cargando empleados…
        </div>
      ) : (
        <div className="proveedores-grid">
          {filtered.map(e => (
            <EmpleadoCard key={e.id} emp={e} onEdit={openEdit} onDelete={askDelete} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              {search ? `Sin resultados para "${search}"` : 'No hay empleados registrados.'}
            </div>
          )}
        </div>
      )}

      {/* Modal Añadir/Modificar */}
      <EmpleadoModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        empleado={editTarget}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmDeleteModal
        empleado={confirmTarget}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        deleting={deleting}
        blockError={blockError}
      />
    </div>
  );
}
