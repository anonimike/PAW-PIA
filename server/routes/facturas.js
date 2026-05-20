/**
 * routes/facturas.js — Crear venta (transacción) + historial
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/facturas?fecha=hoy|semana&id=X
router.get('/', (req, res) => {
  const { fecha, id } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  if (id) {
    where += ' AND f.id = ?';
    params.push(Number(id));
  }

  if (fecha === 'hoy') {
    where += " AND date(f.fecha) = date('now','localtime')";
  } else if (fecha === 'semana') {
    where += " AND f.fecha >= datetime('now','-7 days','localtime')";
  }

  const rows = db.prepare(`
    SELECT f.id, f.fecha, f.total, f.subtotal, f.iva,
           f.metodo_pago, f.notas,
           e.nombre AS nombre_empleado
    FROM   facturas f
    LEFT JOIN empleados e ON e.id = f.empleado_id
    ${where}
    ORDER  BY f.fecha DESC
    LIMIT  200
  `).all(...params);

  res.json(rows);
});

// GET /api/facturas/:id/detalle
router.get('/:id/detalle', (req, res) => {
  const detalle = db.prepare(`
    SELECT df.id, df.cantidad, df.precio_unitario, df.subtotal,
           p.nombre AS producto_nombre, p.codigo
    FROM   detalle_factura df
    JOIN   productos p ON p.id = df.producto_id
    WHERE  df.factura_id = ?
    ORDER  BY df.id
  `).all(req.params.id);
  res.json(detalle);
});

// POST /api/facturas  — Transacción atómica de venta
router.post('/', (req, res) => {
  const { items, empleado_id, metodo_pago = 'Efectivo', notas = '' } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No hay productos en la venta' });
  }

  // Verificar stock antes de cualquier escritura
  for (const item of items) {
    const prod = db.prepare(
      `SELECT stock_actual, nombre FROM productos WHERE id = ? AND activo = 1`
    ).get(item.producto_id);
    if (!prod) return res.status(404).json({ error: `Producto ${item.producto_id} no encontrado` });
    if (prod.stock_actual < item.cantidad) {
      return res.status(409).json({ error: `Stock insuficiente: ${prod.nombre}` });
    }
  }

  // Transacción atómica
  const venta = db.transaction(() => {
    // Precio final almacenado ya incluye todo — sin IVA separado
    const total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);

    // 1. Insertar cabecera (iva = 0, subtotal = total)
    const { lastInsertRowid: facturaId } = db.prepare(`
      INSERT INTO facturas (total, subtotal, iva, empleado_id, metodo_pago, notas)
      VALUES (?, ?, 0, ?, ?, ?)
    `).run(total, total, empleado_id ?? null, metodo_pago, notas);

    // 2. Insertar cada línea del detalle + descontar stock
    const insDetalle = db.prepare(`
      INSERT INTO detalle_factura (factura_id, producto_id, cantidad, precio_unitario)
      VALUES (?, ?, ?, ?)
    `);
    const updStock = db.prepare(`
      UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?
    `);

    for (const item of items) {
      insDetalle.run(facturaId, item.producto_id, item.cantidad, item.precio_unitario);
      updStock.run(item.cantidad, item.producto_id);
    }

    return { facturaId, total, subtotal: total, iva: 0 };
  });

  try {
    const result = venta();
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
});

module.exports = router;
