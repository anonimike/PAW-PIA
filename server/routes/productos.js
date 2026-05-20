/**
 * routes/productos.js — CRUD de productos + búsqueda por código
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/productos  (con join al proveedor)
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, pv.nombre AS proveedor_nombre
    FROM   productos p
    LEFT JOIN proveedores pv ON pv.id = p.proveedor_id
    WHERE  p.activo = 1
    ORDER  BY p.nombre
  `).all();
  res.json(rows);
});

// GET /api/productos/codigo/:codigo
router.get('/codigo/:codigo', (req, res) => {
  const row = db.prepare(
    `SELECT * FROM productos WHERE codigo = ? AND activo = 1`
  ).get(req.params.codigo);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(row);
});

// POST /api/productos
router.post('/', (req, res) => {
  const { codigo, nombre, precio_venta, precio_costo,
          stock_actual, stock_minimo, proveedor_id, unidad } = req.body;

  // Validación básica
  if (!codigo || !/^\d{4}$/.test(codigo)) return res.status(400).json({ error: 'El código debe tener exactamente 4 dígitos.' });
  if (!nombre?.trim())                     return res.status(400).json({ error: 'El nombre es obligatorio.' });

  // ── Verificar si el código ya existe ──────────────────────────────────────
  const existing = db.prepare(`SELECT id, activo FROM productos WHERE codigo = ?`).get(codigo);

  if (existing) {
    if (existing.activo === 1) {
      // El código pertenece a un producto activo → conflicto real
      return res.status(409).json({ error: `El código "${codigo}" ya está en uso por otro producto activo.` });
    }

    // El código pertenece a un producto eliminado (soft-delete) → reactivarlo con los nuevos datos
    db.prepare(`
      UPDATE productos
      SET nombre=?, precio_venta=?, precio_costo=?,
          stock_actual=?, stock_minimo=?, proveedor_id=?, unidad=?, activo=1
      WHERE id=?
    `).run(nombre.trim(), precio_venta ?? 0, precio_costo ?? 0,
           stock_actual ?? 0, stock_minimo ?? 5, proveedor_id ?? null, unidad ?? 'pza',
           existing.id);

    return res.status(201).json({ id: existing.id });
  }

  // Código completamente nuevo → INSERT normal
  try {
    const info = db.prepare(`
      INSERT INTO productos (codigo, nombre, precio_venta, precio_costo,
                             stock_actual, stock_minimo, proveedor_id, unidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(codigo, nombre.trim(), precio_venta ?? 0, precio_costo ?? 0,
           stock_actual ?? 0, stock_minimo ?? 5, proveedor_id ?? null, unidad ?? 'pza');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: `El código "${codigo}" ya está en uso.` });
    }
    throw err;
  }
});

// PUT /api/productos/:id
router.put('/:id', (req, res) => {
  const { nombre, precio_venta, precio_costo,
          stock_actual, stock_minimo, proveedor_id, unidad } = req.body;

  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  const result = db.prepare(`
    UPDATE productos
    SET nombre=?, precio_venta=?, precio_costo=?,
        stock_actual=?, stock_minimo=?, proveedor_id=?, unidad=?
    WHERE id=? AND activo=1
  `).run(nombre.trim(), precio_venta, precio_costo ?? 0,
         stock_actual, stock_minimo, proveedor_id, unidad, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json({ ok: true });
});

// DELETE /api/productos/:id  (soft delete — conserva integridad referencial con detalle_factura)
router.delete('/:id', (req, res) => {
  const result = db.prepare(`UPDATE productos SET activo=0 WHERE id=? AND activo=1`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
