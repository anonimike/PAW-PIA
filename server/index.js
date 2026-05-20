/**
 * index.js — Servidor Express principal de Carnicería y Abarrotes "Lupita"
 * Puerto: 3001
 */
const express    = require('express');
const cors       = require('cors');

const productosRouter  = require('./routes/productos');
const facturasRouter   = require('./routes/facturas');
const proveedoresRouter = require('./routes/proveedores');
const empleadosRouter  = require('./routes/empleados');
const loginRouter      = require('./routes/login');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ── Rutas ───────────────────────────────────────────────────
app.use('/api/productos',   productosRouter);
app.use('/api/facturas',    facturasRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/empleados',   empleadosRouter);
app.use('/api/login',       loginRouter);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Error global ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅  Backend de Carnicería y Abarrotes "Lupita" corriendo en http://localhost:${PORT}`);
});
