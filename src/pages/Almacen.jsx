import { useState, useEffect, useCallback } from 'react';
import ProductoModal from '../components/ProductoModal';

const API = 'http://localhost:3001/api';

/* ── Helpers de UI ── */
function stockBadge(stock, min) {
  if (stock === 0)   return <span className="badge badge-danger">Agotado</span>;
  if (stock <= min)  return <span className="badge badge-warning">Bajo</span>;
  return                    <span className="badge badge-success">OK</span>;
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

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconWarning() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/* Flechas de ordenamiento */
function IconSortNone() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
      <polyline points="8 9 12 4 16 9"/>
      <polyline points="16 15 12 20 8 15"/>
    </svg>
  );
}
function IconSortAsc() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 15 12 9 16 15"/>
    </svg>
  );
}
function IconSortDesc() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 9 12 15 16 9"/>
    </svg>
  );
}

/* Encabezado de columna clicable */
function SortableHeader({ col, label, sortCol, sortDir, onSort, style }) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        color: active ? 'var(--accent)' : undefined,
        ...style,
      }}
      title={`Ordenar por ${label}`}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? (sortDir === 'asc' ? <IconSortAsc /> : <IconSortDesc />)
          : <IconSortNone />}
      </span>
    </th>
  );
}

/* ── Modal de Confirmación de Eliminación ── */
function ConfirmDeleteModal({ producto, onConfirm, onCancel, deleting }) {
  /* Cerrar con Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !deleting) onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, deleting]);

  if (!producto) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={!deleting ? onCancel : undefined} />
      <div
        className="modal-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        style={{ width: 'min(420px, calc(100vw - 32px))' }}
      >
        <div style={{ padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          {/* Ícono de advertencia */}
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--danger-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--danger)',
            flexShrink: 0,
          }}>
            <IconWarning />
          </div>

          <div>
            <h2 id="confirm-title" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Eliminar producto
            </h2>
            <p id="confirm-desc" style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              ¿Estás seguro de que deseas eliminar{' '}
              <strong style={{ color: 'var(--text-primary)' }}>"{producto.nombre}"</strong>?
              <br />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Esta acción no se puede deshacer.
              </span>
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={deleting}
            style={{ minWidth: 110 }}
            autoFocus
          >
            Cancelar
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              minWidth: 110,
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
            }}
          >
            {deleting ? (
              <><span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> Eliminando…</>
            ) : (
              <><IconTrash /> Sí, eliminar</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════
   Componente principal
══════════════════════════════════════ */
export default function Almacen() {
  const [products,       setProducts]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState('');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [confirmTarget,  setConfirmTarget]  = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [sortCol,        setSortCol]        = useState('nombre');   // columna activa
  const [sortDir,        setSortDir]        = useState('asc');      // 'asc' | 'desc'

  /* ── Cargar productos ── */
  const loadProducts = useCallback(() => {
    setLoading(true);
    fetch(`${API}/productos`)
      .then(r => { if (!r.ok) throw new Error('Error del servidor'); return r.json(); })
      .then(data => {
        setProducts(data.map(p => ({
          id:               p.id,
          nombre:           p.nombre,
          codigo:           p.codigo,
          stock_actual:     p.stock_actual,
          stock_minimo:     p.stock_minimo,
          precio_venta:     p.precio_venta,
          proveedor_id:     p.proveedor_id,
          proveedor_nombre: p.proveedor_nombre ?? '—',
          unidad:           p.unidad,
          // Campo derivado para ordenar por Estado: 2=Agotado > 1=Bajo > 0=OK
          _estado: p.stock_actual === 0 ? 2 : p.stock_actual <= p.stock_minimo ? 1 : 0,
        })));
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  /* ── Ordenamiento ── */
  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  /* ── Filtro + ordenamiento combinados ── */
  const filtered = products
    .filter(p =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.includes(search)
    )
    .sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
      // Normalizar: strings insensibles, números directos
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va === null || va === undefined) va = '';
      if (vb === null || vb === undefined) vb = '';
      if (va < vb) return sortDir === 'asc' ? -1 :  1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

  /* ── Stats ── */
  const lowStock = products.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length;
  const agotados = products.filter(p => p.stock_actual === 0).length;

  /* ── Modal Agregar/Editar ── */
  const openAdd    = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (p) => { setEditTarget(p);   setModalOpen(true); };
  const closeModal = ()  => { setModalOpen(false); setEditTarget(null); };

  const handleSaved = (saved) => {
    // Recalcular _estado para que el ordenamiento por estado sea correcto
    const enriched = {
      ...saved,
      _estado: saved.stock_actual === 0 ? 2 : saved.stock_actual <= saved.stock_minimo ? 1 : 0,
    };
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === enriched.id);
      if (idx === -1) return [enriched, ...prev];
      const copy = [...prev];
      copy[idx] = enriched;
      return copy;
    });
  };

  /* ── Eliminar (con modal propio) ── */
  const askDelete = (producto) => setConfirmTarget(producto);
  const cancelDelete = () => { if (!deleting) setConfirmTarget(null); };

  const confirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/productos/${confirmTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      setProducts(prev => prev.filter(p => p.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch (err) {
      // Mostrar error dentro del mismo modal (no usar alert nativo)
      setConfirmTarget(prev => ({ ...prev, _error: err.message }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Almacén</h1>
          <p>Gestión de inventario y control de stock</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <IconPlus /> Agregar Producto
        </button>
      </div>

      {/* Stats */}
      <div className="almacen-stats">
        <div className="stat-card card">
          <span className="stat-value">{products.length}</span>
          <span className="stat-label">Total Productos</span>
        </div>
        <div className="stat-card card" style={{ borderLeft: lowStock > 0 ? '3px solid var(--warning)' : undefined }}>
          <span className="stat-value" style={{ color: lowStock > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{lowStock}</span>
          <span className="stat-label">Stock Bajo</span>
        </div>
        <div className="stat-card card" style={{ borderLeft: agotados > 0 ? '3px solid var(--danger)' : undefined }}>
          <span className="stat-value" style={{ color: agotados > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{agotados}</span>
          <span className="stat-label">Agotados</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
          <input
            className="input"
            placeholder="Buscar por nombre o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          {search && (
            <button className="btn btn-secondary" onClick={() => setSearch('')} style={{ padding: '8px 12px' }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {error ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>
            ⚠ {error} — ¿El servidor está corriendo?
          </div>
        ) : loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Cargando productos…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {search ? `Sin resultados para "${search}"` : 'No hay productos registrados.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <SortableHeader col="nombre"           label="Producto"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="codigo"           label="Código"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="proveedor_nombre" label="Proveedor"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="stock_actual"     label="Stock"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="stock_minimo"     label="Stock Mín." sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="precio_venta"     label="Precio"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <SortableHeader col="_estado"          label="Estado"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isLow   = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
                  const isEmpty = p.stock_actual === 0;

                  return (
                    <tr
                      key={p.id}
                      style={
                        isEmpty ? { background: '#fff5f5' }
                        : isLow ? { background: '#fffbeb' }
                        : undefined
                      }
                    >
                      <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                      <td>
                        <code style={{ fontSize: 12, background: 'var(--bg)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                          {p.codigo}
                        </code>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{p.proveedor_nombre}</td>
                      <td style={{
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        color: isEmpty ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--text-primary)',
                      }}>
                        {p.stock_actual}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{p.stock_minimo}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>${p.precio_venta.toFixed(2)}</td>
                      <td>{stockBadge(p.stock_actual, p.stock_minimo)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => openEdit(p)}
                            title="Editar producto"
                          >
                            <IconEdit /> Editar
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => askDelete(p)}
                            title={`Eliminar ${p.nombre}`}
                          >
                            <IconTrash /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar / Editar */}
      <ProductoModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={handleSaved}
        producto={editTarget}
      />

      {/* Modal Confirmar Eliminación */}
      <ConfirmDeleteModal
        producto={confirmTarget}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        deleting={deleting}
      />
    </div>
  );
}
