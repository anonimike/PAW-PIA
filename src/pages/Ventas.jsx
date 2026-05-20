import { useRef, useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import './Ventas.css';

const API = 'http://localhost:3001/api';

// ── Íconos inline ─────────────────────────────────────────────
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);

const IconBarcode = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/>
  </svg>
);

const IconCash = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
);

const IconCard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────
const fmt = (n) => `$${Number(n).toFixed(2)}`;

/**
 * Parsea la cadena de entrada del operador.
 * Formatos válidos:
 *   "1001"       → { qty: 1,  code: "1001" }
 *   "10*1001"    → { qty: 10, code: "1001" }
 *   "10 * 1001"  → { qty: 10, code: "1001" }
 */
function parseInput(raw) {
  const s = raw.trim();
  if (!s) return null;
  if (s.includes('*')) {
    const [qPart, cPart] = s.split('*');
    const qty  = parseInt(qPart.trim(), 10);
    const code = cPart.trim();
    if (!qty || qty < 1 || !code) return null;
    return { qty, code };
  }
  return { qty: 1, code: s };
}

// ── Modal Buscador de Productos ──────────────────────────────
function BuscadorModal({ onSelect, onClose }) {
  const [query,    setQuery]    = useState('');
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const searchRef = useRef(null);

  // Cargar todos los productos activos al abrir
  useEffect(() => {
    fetch(`${API}/productos`)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
    setTimeout(() => searchRef.current?.focus(), 80);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = query.trim()
    ? products.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        p.codigo.includes(query)
      )
    : products;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Panel */}
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar producto"
        style={{ width: 'min(520px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 64px)' }}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconSearch /> Buscar Producto
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        {/* Buscador */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }}>
              <IconSearch />
            </span>
            <input
              ref={searchRef}
              className="input"
              style={{ paddingLeft: 36 }}
              type="text"
              placeholder="Escribe el nombre o código del producto…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Lista de resultados */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px 12px' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Cargando productos…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sin resultados para <strong>"{query}"</strong>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map(p => {
                const stockOk    = p.stock_actual > p.stock_minimo;
                const stockBajo  = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
                const agotado    = p.stock_actual === 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p.codigo)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-soft)',
                      background: agotado ? '#fff5f5' : 'var(--surface)',
                      cursor: agotado ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      gap: 12,
                      transition: 'background var(--transition), box-shadow var(--transition)',
                      opacity: agotado ? 0.6 : 1,
                    }}
                    disabled={agotado}
                    title={agotado ? 'Producto agotado' : `Agregar ${p.nombre}`}
                    onMouseEnter={e => { if (!agotado) e.currentTarget.style.background = 'var(--accent-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = agotado ? '#fff5f5' : 'var(--surface)'; }}
                  >
                    {/* Info producto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nombre}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        ${Number(p.precio_venta).toFixed(2)}
                      </div>
                    </div>

                    {/* Código */}
                    <code style={{
                      fontSize: 13, fontWeight: 700,
                      background: 'var(--bg)', padding: '3px 10px',
                      borderRadius: 6, color: 'var(--accent)',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}>
                      {p.codigo}
                    </code>

                    {/* Badge estado */}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px',
                      borderRadius: 999, flexShrink: 0,
                      background: agotado ? 'var(--danger-light)' : stockBajo ? 'var(--warning-light)' : 'var(--success-light)',
                      color: agotado ? 'var(--danger)' : stockBajo ? 'var(--warning)' : 'var(--success)',
                    }}>
                      {agotado ? 'Agotado' : stockBajo ? 'Bajo' : 'OK'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'} · Haz clic para insertar el código
          </span>
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </>
  );
}

// ── Modal de Cobro ────────────────────────────────────────────
function CobroModal({ total, onConfirm, onClose, procesando }) {
  const [metodo,   setMetodo]   = useState('Efectivo');
  const [recibido, setRecibido] = useState('');
  const cashInputRef = useRef(null);

  // Focus automático al input de efectivo cuando cambia el modo
  useEffect(() => {
    if (metodo === 'Efectivo') {
      setTimeout(() => cashInputRef.current?.focus(), 80);
    }
  }, [metodo]);

  const cambio = metodo === 'Efectivo'
    ? Math.max(0, parseFloat(recibido || 0) - total)
    : 0;

  const cambioExacto = parseFloat(recibido || 0) === total;
  const puedeConfirmar = metodo === 'Tarjeta'
    || (metodo === 'Efectivo' && parseFloat(recibido || 0) >= total);

  function handleKeyDown(e) {
    if (e.key === 'F11') {
      e.preventDefault();
      // Atajo: pago exacto
      if (metodo === 'Efectivo') setRecibido(String(total.toFixed(2)));
    }
    if (e.key === 'Enter' && puedeConfirmar && !procesando) {
      onConfirm({ metodo_pago: metodo });
    }
    if (e.key === 'Escape') onClose();
  }

  // Teclas de acceso rápido para cambios rápidos de efectivo
  const rapidoValues = [50, 100, 200, 500];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cobro-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="cobro-header">
          <div>
            <h2 className="cobro-title">Finalizar Venta</h2>
            <p className="cobro-sub">Selecciona el método de pago</p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar (Esc)">
            <IconClose />
          </button>
        </div>

        {/* Total grande */}
        <div className="cobro-total-display">
          <span className="cobro-total-label">Total a cobrar</span>
          <span className="cobro-total-amount">{fmt(total)}</span>
        </div>

        {/* Métodos de pago */}
        <div className="cobro-metodos">
          <button
            className={`cobro-metodo-btn${metodo === 'Efectivo' ? ' active-cash' : ''}`}
            onClick={() => setMetodo('Efectivo')}
          >
            <IconCash />
            <span>Efectivo</span>
          </button>
          <button
            className={`cobro-metodo-btn${metodo === 'Tarjeta' ? ' active-card' : ''}`}
            onClick={() => setMetodo('Tarjeta')}
          >
            <IconCard />
            <span>Tarjeta</span>
          </button>
        </div>

        {/* Calculadora de cambio (solo efectivo) */}
        {metodo === 'Efectivo' && (
          <div className="cobro-cambio-section">
            <label className="cobro-label">Monto recibido</label>
            <input
              ref={cashInputRef}
              className="input cobro-cash-input"
              type="number"
              min={0}
              step="0.50"
              placeholder="0.00"
              value={recibido}
              onChange={e => setRecibido(e.target.value)}
            />

            {/* Botones rápidos */}
            <div className="cobro-rapidos">
              {rapidoValues.map(v => (
                <button
                  key={v}
                  className={`cobro-rapido${parseFloat(recibido) === v ? ' selected' : ''}`}
                  onClick={() => setRecibido(String(v))}
                >
                  ${v}
                </button>
              ))}
              <button
                className={`cobro-rapido${cambioExacto ? ' selected' : ''}`}
                onClick={() => setRecibido(String(total.toFixed(2)))}
                title="Pago exacto (F11)"
              >
                Exacto · F11
              </button>
            </div>

            {/* Cambio */}
            <div className={`cobro-cambio-display${parseFloat(recibido || 0) > 0 ? ' visible' : ''}`}>
              <span className="cobro-cambio-label">Cambio a devolver</span>
              <span className={`cobro-cambio-valor${cambio > 0 ? ' positivo' : ' cero'}`}>
                {fmt(cambio)}
              </span>
            </div>
          </div>
        )}

        {/* Tarjeta: mensaje simple */}
        {metodo === 'Tarjeta' && (
          <div className="cobro-tarjeta-msg">
            <IconCard />
            <span>Pase la tarjeta en el terminal y confirme.</span>
          </div>
        )}

        {/* Acciones */}
        <div className="cobro-footer">
          <button className="btn btn-secondary cobro-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn cobro-confirm"
            disabled={!puedeConfirmar || procesando}
            onClick={() => onConfirm({ metodo_pago: metodo })}
          >
            {procesando ? 'Procesando…' : `Confirmar · ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────
export default function Ventas() {
  const { user } = useOutletContext() || {};
  const [rawInput,      setRawInput]      = useState('');
  const [items,         setItems]         = useState([]);
  const [flash,         setFlash]         = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [buscadorOpen,  setBuscadorOpen]  = useState(false);
  const [procesando,    setProcesando]    = useState(false);
  const inputRef = useRef(null);

  // Autofocus al montar
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── F8 = Cancelar · F10 = Buscador · F12 = Cobrar ──────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'F8') {
        e.preventDefault();
        clearAll();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        setBuscadorOpen(b => !b);
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (items.length > 0) setModalOpen(true);
      }
      if (e.key === 'Escape') {
        setModalOpen(false);
        setBuscadorOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items]);

  // ── Buscar y agregar producto ─────────────────────────────
  const submitInput = useCallback(async (raw) => {
    const parsed = parseInput(raw);
    if (!parsed) return;
    const { qty, code } = parsed;

    // Si ya está en el ticket, solo suma la cantidad
    const existing = items.find(i => i.code === code);
    if (existing) {
      setItems(prev => prev.map(i =>
        i.code === code ? { ...i, qty: i.qty + qty } : i
      ));
      showFlash('ok', `+${qty} × ${existing.name}`);
      setRawInput('');
      return;
    }

    try {
      const res = await fetch(`${API}/productos/codigo/${code}`);
      if (!res.ok) throw new Error('no encontrado');
      const p = await res.json();
      setItems(prev => [...prev, {
        code:        p.codigo,
        name:        p.nombre,
        price:       p.precio_venta,
        producto_id: p.id,
        qty,
      }]);
      showFlash('ok', qty > 1 ? `+${qty} × ${p.nombre}` : p.nombre);
    } catch {
      showFlash('err', `Código "${code}" no encontrado`);
    }

    setRawInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [items]); // eslint-disable-line

  function showFlash(type, msg) {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), type === 'ok' ? 1600 : 2500);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') submitInput(rawInput);
  }

  function removeItem(code) {
    setItems(prev => prev.filter(i => i.code !== code));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function clearAll() {
    setItems([]);
    setRawInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Cambio en el input: solo dígitos y un asterisco ────────
  function handleInputChange(e) {
    // Permitir: dígitos, un *, espacios alrededor del *
    const val = e.target.value.replace(/[^0-9*\s]/g, '');
    setRawInput(val);
  }

  // ── Confirmar pago desde el modal ─────────────────────────
  async function handleConfirmarPago({ metodo_pago }) {
    if (items.length === 0 || procesando) return;
    setProcesando(true);

    const payload = {
      empleado_id: user?.id ?? null,
      metodo_pago,
      items: items.map(i => ({
        producto_id:     i.producto_id,
        cantidad:        i.qty,
        precio_unitario: i.price,
      })),
    };

    try {
      const res  = await fetch(`${API}/facturas`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar');

      setModalOpen(false);
      setItems([]);
      setRawInput('');
      showFlash('ok', `✓ Factura #${String(data.facturaId).padStart(6, '0')} registrada`);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      showFlash('err', err.message);
    } finally {
      setProcesando(false);
    }
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  // Determinar tipo de input para el placeholder dinámico
  const hasAsterisk = rawInput.includes('*');

  return (
    <div className="ventas-layout">

      {/* ── Panel Izquierdo ── */}
      <section className="ventas-left">

        {/* Tarjeta de escaneo */}
        <div className="ventas-scan-card card">
          <div className="scan-icon-wrap"><IconBarcode /></div>
          <h2 className="scan-title">Punto de Venta</h2>
          <p className="scan-hint">
            Código: <code>1001</code> &nbsp;·&nbsp; Con cantidad: <code>10*1001</code>
          </p>

          <div className={`scan-input-wrap${flash ? ` flash-${flash.type}` : ''}`}>
            <input
              ref={inputRef}
              className={`scan-input${hasAsterisk ? ' has-asterisk' : ''}`}
              type="text"
              value={rawInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={hasAsterisk ? 'cant * código' : '_ _ _ _'}
              autoComplete="off"
              spellCheck={false}
              maxLength={12}
            />
          </div>

          {flash && (
            <div className={`scan-feedback ${flash.type}`}>
              {flash.type === 'ok' ? '✓' : '✗'} {flash.msg}
            </div>
          )}

          <button
            className="btn btn-primary scan-btn"
            onClick={() => submitInput(rawInput)}
          >
            Agregar
          </button>

          {/* Botón buscador de productos */}
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 8, gap: 7, justifyContent: 'center' }}
            onClick={() => setBuscadorOpen(true)}
            title="Buscar producto por nombre (F10)"
          >
            <IconSearch /> Buscar producto · F10
          </button>
        </div>

        {/* Panel de Total */}
        <div className="ventas-totals card">
          <div className="total-section">
            <span className="total-label">Total</span>
            <span className="total-amount">{fmt(total)}</span>
          </div>

          <div className="total-items-count">
            {items.length > 0
              ? `${items.reduce((s,i) => s + i.qty, 0)} artículos en el carrito`
              : 'Carrito vacío'}
          </div>

          <div className="total-actions">
            <button
              className="btn btn-secondary"
              onClick={clearAll}
              disabled={items.length === 0}
              title="Cancelar venta (F8)"
            >
              Cancelar · F8
            </button>
            <button
              className="btn cobrar-btn"
              disabled={items.length === 0}
              onClick={() => setModalOpen(true)}
              title="Abrir cobro (F12)"
            >
              Cobrar · F12
            </button>
          </div>
        </div>
      </section>

      {/* ── Panel Derecho: Ticket ── */}
      <section className="ventas-right">
        <div className="ticket-header">
          <h2>Ticket de venta</h2>
          <span className="badge badge-success">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="ticket-empty">
            <div className="ticket-empty-inner">
              <IconBarcode />
              <span>Escanea un producto para comenzar</span>
            </div>
          </div>
        ) : (
          <div className="ticket-list">
            {items.map(item => (
              <div key={item.code} className="ticket-item">
                <div className="ticket-item-info">
                  <span className="ticket-item-name">{item.name}</span>
                  <span className="ticket-item-code">
                    {item.code}
                    {item.qty > 1 && (
                      <span className="ticket-unit-price">{fmt(item.price)} c/u</span>
                    )}
                  </span>
                </div>
                <div className="ticket-item-right">
                  <span className="ticket-qty">×{item.qty}</span>
                  <div className="ticket-prices">
                    {item.qty > 1 && (
                      <span className="ticket-price-unit">{fmt(item.price)}</span>
                    )}
                    <span className="ticket-price">{fmt(item.price * item.qty)}</span>
                  </div>
                  <button className="btn-icon" onClick={() => removeItem(item.code)} title="Quitar">
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pie del ticket con total resumido */}
        {items.length > 0 && (
          <div className="ticket-footer">
            <span>Total</span>
            <span className="ticket-footer-total">{fmt(total)}</span>
          </div>
        )}
      </section>

      {/* ── Modal de Cobro ── */}
      {modalOpen && (
        <CobroModal
          total={total}
          onConfirm={handleConfirmarPago}
          onClose={() => { if (!procesando) setModalOpen(false); }}
          procesando={procesando}
        />
      )}

      {/* ── Modal Buscador de Productos ── */}
      {buscadorOpen && (
        <BuscadorModal
          onSelect={(codigo) => {
            setRawInput(codigo);
            setBuscadorOpen(false);
            setTimeout(() => inputRef.current?.focus(), 60);
          }}
          onClose={() => setBuscadorOpen(false)}
        />
      )}
    </div>
  );
}
