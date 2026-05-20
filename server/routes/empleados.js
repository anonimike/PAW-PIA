/**
 * routes/empleados.js
 */
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const db      = require('../db');

// GET /api/empleados
router.get('/', (_, res) => {
  const rows = db.prepare(`
    SELECT e.id, e.usuario, e.nombre, e.rol, e.telefono, e.email, e.horario, e.salario, e.estado,
           COUNT(f.id) AS total_facturas
    FROM   empleados e
    LEFT JOIN facturas f ON f.empleado_id = e.id
    GROUP BY e.id
    ORDER BY e.nombre
  `).all();
  res.json(rows);
});

// POST /api/empleados
router.post('/', async (req, res) => {
  const { usuario, password, nombre, rol, telefono, email, horario, salario, estado, pin } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (!usuario?.trim()) return res.status(400).json({ error: 'El usuario es obligatorio.' });
  if (!password) return res.status(400).json({ error: 'La contraseña es obligatoria.' });

  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    const r = db.prepare(`
      INSERT INTO empleados (usuario, password, nombre, rol, telefono, email, horario, salario, estado, pin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      usuario.trim().toLowerCase(),
      hashedPwd,
      nombre.trim(),
      rol ?? 'Empleado',
      telefono ?? null,
      email ?? null,
      horario ?? null,
      salario ?? 0,
      estado ?? 'Activo',
      pin ?? null
    );
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/empleados/:id
router.put('/:id', async (req, res) => {
  const { usuario, password, nombre, rol, telefono, email, horario, salario, estado } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (!usuario?.trim()) return res.status(400).json({ error: 'El usuario es obligatorio.' });

  try {
    let result;
    if (password && password.trim() !== '') {
      const hashedPwd = await bcrypt.hash(password, 10);
      result = db.prepare(`
        UPDATE empleados
        SET usuario=?, password=?, nombre=?, rol=?, telefono=?, email=?, horario=?, salario=?, estado=?
        WHERE id=?
      `).run(
        usuario.trim().toLowerCase(),
        hashedPwd,
        nombre.trim(),
        rol ?? 'Empleado',
        telefono ?? null,
        email ?? null,
        horario ?? null,
        salario ?? 0,
        estado ?? 'Activo',
        req.params.id
      );
    } else {
      result = db.prepare(`
        UPDATE empleados
        SET usuario=?, nombre=?, rol=?, telefono=?, email=?, horario=?, salario=?, estado=?
        WHERE id=?
      `).run(
        usuario.trim().toLowerCase(),
        nombre.trim(),
        rol ?? 'Empleado',
        telefono ?? null,
        email ?? null,
        horario ?? null,
        salario ?? 0,
        estado ?? 'Activo',
        req.params.id
      );
    }
    
    if (result.changes === 0) return res.status(404).json({ error: 'Empleado no encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/empleados/:id
// ── Regla de integridad: si tiene facturas registradas → bloquear ──
router.delete('/:id', (req, res) => {
  const { count } = db.prepare(`
    SELECT COUNT(*) AS count FROM facturas
    WHERE empleado_id = ?
  `).get(req.params.id);

  if (count > 0) {
    return res.status(409).json({
      error: `Este empleado ha registrado ${count} venta${count !== 1 ? 's' : ''}. Márcalo como "Inactivo" en lugar de eliminarlo para conservar el historial financiero.`,
      facturas_count: count,
    });
  }

  // Sin historial de ventas → eliminación física segura
  const result = db.prepare(`DELETE FROM empleados WHERE id=?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Empleado no encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
