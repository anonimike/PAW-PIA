/**
 * index.js — Servidor Express principal de Carnicería y Abarrotes "Lupita"
 * Puerto: 3001
 */
const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const productosRouter  = require('./routes/productos');
const facturasRouter   = require('./routes/facturas');
const proveedoresRouter = require('./routes/proveedores');
const empleadosRouter  = require('./routes/empleados');
const loginRouter      = require('./routes/login');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
// Habilitar CORS (puedes ajustar el origin para producción si es necesario)
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Servir los archivos estáticos de React (Vite build)
app.use(express.static(path.join(__dirname, '../dist')));

// ── Rutas ───────────────────────────────────────────────────
app.use('/api/productos',   productosRouter);
app.use('/api/facturas',    facturasRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/empleados',   empleadosRouter);
app.use('/api/login',       loginRouter);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Rutas Frontend (Catch-all) ────────────────────────────
// Cualquier petición que no sea de la API (/api/...) devolverá la App de React.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ── Error global ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅  Backend de Carnicería y Abarrotes "Lupita" corriendo en http://localhost:${PORT}`);
});
