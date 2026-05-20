/**
 * routes/login.js
 */
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const db      = require('../db');

// POST /api/login
router.post('/', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const empleado = db.prepare('SELECT * FROM empleados WHERE usuario = ? AND estado = ?').get(usuario, 'Activo');

    if (!empleado) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    if (!empleado.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(password, empleado.password);

    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Login successful
    res.json({
      id: empleado.id,
      nombre: empleado.nombre,
      rol: empleado.rol,
      usuario: empleado.usuario
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
