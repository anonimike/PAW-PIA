import { useState, useEffect, useCallback } from 'react';
import ProveedorModal from '../components/ProveedorModal';
import './shared.css';

const API = 'http://localhost:3001/api';

/* ── Paleta de colores por índice ── */
const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];
const avatarColor = (id) => COLORS[id % COLORS.length];

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
function IconPhone() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconBox() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
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

/* ── Tarjeta de proveedor ── */
function ProveedorCard({ prov, onEdit, onDelete }) {
  const color = avatarColor(prov.id);
  const initial = (prov.nombre ?? prov.name ?? '?').charAt(0).toUpperCase();

  return (
    <div className="proveedor-card card" style={{ opacity: prov.estado === 'Inactivo' ? 0.72 : 1 }}>
      {/* Avatar */}
      <div className="prov-avatar" style={{ background: color + '18', color }}>
        {initial}
      </div>

      {/* Info */}
      <div className="prov-info">
        <div className="prov-name">{prov.nombre ?? prov.name}</div>
        <div className="prov-meta">
          {(prov.contacto || prov.contact) && (
            <>
              <IconUser />
              <span>{prov.contacto ?? prov.contact}</span>
            </>
          )}
          {(prov.contacto || prov.contact) && (prov.telefono || prov.phone) && <span className="prov-dot">·</span>}
          {(prov.telefono || prov.phone) && (
            <>
              <IconPhone />
              <span>{prov.telefono ?? prov.phone}</span>
            </>
          )}
        </div>

        {/* Productos asociados */}
        {prov.total_productos > 0 && (
          <div className="prov-meta" style={{ marginTop: 4 }}>
            <IconBox />
            <span style={{ color: 'var(--accent)' }}>{prov.total_productos} producto{prov.total_productos !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Badge estado */}
        <span
          className={`badge ${prov.estado === 'Activo' ? 'badge-success' : 'badge-danger'}`}
          style={{ marginTop: 8, alignSelf: 'flex-start' }}
        >
          {prov.estado}
        </span>
      </div>

      {/* Categoría tag */}
      <div className="prov-tag">{prov.categoria ?? prov.category ?? 'General'}</div>

      {/* Acciones */}
      <div className="prov-actions">
        <button
          className="btn btn-secondary"
          style={{ fontSize: 12, padding: '5px 10px' }}
          onClick={() => onEdit(prov)}
          title="Modificar proveedor"
        >
          <IconEdit /> Modificar
        </button>
        <button
          className="btn btn-danger"
          style={{ fontSize: 12, padding: '5px 10px' }}
          onClick={() => onDelete(prov)}
          title="Eliminar proveedor"
        >
          <IconTrash /> Eliminar
        </button>
      </div>
    </div>
  );
}

/* ── Modal de confirmación de eliminación ── */
function ConfirmDeleteModal({ proveedor, onConfirm, onCancel, deleting, blockError }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !deleting) onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel, deleting]);

  if (!proveedor) return null;

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
              {blockError ? 'No se puede eliminar' : 'Eliminar proveedor'}
            </h2>
            {blockError ? (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {blockError}
              </p>
            ) : (
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                ¿Eliminar a <strong style={{ color: 'var(--text-primary)' }}>"{proveedor.nombre ?? proveedor.name}"</strong>?
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
            /* Solo opción: cerrar */
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
   Página principal de Proveedores
══════════════════════════════════════ */
export default function Proveedores() {
  const [proveedores,     setProveedores]     = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [search,          setSearch]          = useState('');
  const [modalOpen,       setModalOpen]       = useState(false);
  const [editTarget,      setEditTarget]      = useState(null);
  const [confirmTarget,   setConfirmTarget]   = useState(null);
  const [blockError,      setBlockError]      = useState('');
  const [deleting,        setDeleting]        = useState(false);
  const [filtroEstado,    setFiltroEstado]    = useState('Todos');

  /* ── Cargar proveedores ── */
  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/proveedores`)
      .then(r => { if (!r.ok) throw new Error('Error del servidor'); return r.json(); })
      .then(data => { setProveedores(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Filtros ── */
  const filtered = proveedores.filter(p => {
    const matchSearch = !search ||
      (p.nombre ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.contacto ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.categoria ?? '').toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'Todos' || p.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  /* ── Stats ── */
  const activos   = proveedores.filter(p => p.estado === 'Activo').length;
  const inactivos = proveedores.filter(p => p.estado === 'Inactivo').length;

  /* ── Modal Añadir/Modificar ── */
  const openAdd  = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (p) => { setEditTarget(p);   setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSaved = (saved) => {
    setProveedores(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx === -1) return [...prev, { ...saved, total_productos: 0 }];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...saved };
      return copy;
    });
  };

  /* ── Eliminar ── */
  const askDelete = (p) => { setBlockError(''); setConfirmTarget(p); };
  const cancelDelete = () => { if (!deleting) { setConfirmTarget(null); setBlockError(''); } };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/proveedores/${confirmTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        // 409 = tiene productos activos → mostrar mensaje bloqueante
        setBlockError(data.error ?? 'No se puede eliminar este proveedor.');
        return;
      }
      setProveedores(prev => prev.filter(p => String(p.id) !== String(confirmTarget.id)));
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
          <h1>Proveedores</h1>
          <p>Directorio y gestión de proveedores</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <IconPlus /> Añadir Proveedor
        </button>
      </div>

      {/* Stats */}
      <div className="almacen-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card card">
          <span className="stat-value">{proveedores.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card card" style={{ borderLeft: activos > 0 ? '3px solid var(--success)' : undefined }}>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{activos}</span>
          <span className="stat-label">Activos</span>
        </div>
        <div className="stat-card card" style={{ borderLeft: inactivos > 0 ? '3px solid var(--danger)' : undefined }}>
          <span className="stat-value" style={{ color: inactivos > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{inactivos}</span>
          <span className="stat-label">Inactivos</span>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Buscar por nombre, contacto o categoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
        {['Todos', 'Activo', 'Inactivo'].map(v => (
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
          Cargando proveedores…
        </div>
      ) : (
        <div className="proveedores-grid">
          {filtered.map(p => (
            <ProveedorCard key={p.id} prov={p} onEdit={openEdit} onDelete={askDelete} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              {search ? `Sin resultados para "${search}"` : 'No hay proveedores registrados.'}
            </div>
          )}
        </div>
      )}

      {/* Modal Añadir/Modificar */}
      <ProveedorModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        proveedor={editTarget}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmDeleteModal
        proveedor={confirmTarget}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        deleting={deleting}
        blockError={blockError}
      />
    </div>
  );
}
