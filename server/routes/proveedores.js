/**
 * routes/proveedores.js — CRUD completo con validación de integridad
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/proveedores
router.get('/', (_, res) => {
  const rows = db.prepare(`
    SELECT p.*,
           COUNT(pr.id) AS total_productos
    FROM   proveedores p
    LEFT JOIN productos pr ON pr.proveedor_id = p.id AND pr.activo = 1
    GROUP BY p.id
    ORDER BY p.nombre
  `).all();
  res.json(rows);
});

// POST /api/proveedores
router.post('/', (req, res) => {
  const { nombre, contacto, telefono, email, direccion, categoria, estado } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  const r = db.prepare(`
    INSERT INTO proveedores (nombre, contacto, telefono, email, direccion, categoria, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    nombre.trim(), contacto ?? null, telefono ?? null,
    email ?? null, direccion ?? null,
    categoria ?? 'General', estado ?? 'Activo'
  );
  res.status(201).json({ id: r.lastInsertRowid });
});

// PUT /api/proveedores/:id
router.put('/:id', (req, res) => {
  const { nombre, contacto, telefono, email, direccion, categoria, estado } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });

  const result = db.prepare(`
    UPDATE proveedores
    SET nombre=?, contacto=?, telefono=?, email=?, direccion=?, categoria=?, estado=?
    WHERE id=?
  `).run(
    nombre.trim(), contacto ?? null, telefono ?? null,
    email ?? null, direccion ?? null,
    categoria ?? 'General', estado ?? 'Activo',
    req.params.id
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Proveedor no encontrado.' });
  res.json({ ok: true });
});

// DELETE /api/proveedores/:id
// ── Regla de integridad: si tiene productos activos vinculados → bloquear ──
router.delete('/:id', (req, res) => {
  const { count } = db.prepare(`
    SELECT COUNT(*) AS count FROM productos
    WHERE proveedor_id = ? AND activo = 1
  `).get(req.params.id);

  if (count > 0) {
    return res.status(409).json({
      error: `Este proveedor tiene ${count} producto${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''} asociado${count > 1 ? 's' : ''}. Márcalo como "Inactivo" en lugar de eliminarlo para preservar el historial de ventas.`,
      productos_activos: count,
    });
  }

  // Sin productos activos → eliminación física segura
  const result = db.prepare(`DELETE FROM proveedores WHERE id=?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Proveedor no encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
