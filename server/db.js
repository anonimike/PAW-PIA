/**
 * db.js — Conexión singleton a SQLite con better-sqlite3.
 * Se ejecuta el schema.sql automáticamente si la BD es nueva.
 */
const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DB_PATH     = path.join(__dirname, 'berrones.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH, {
  // verbose: console.log,   // ← descomenta para depurar queries
});

// Aplica el schema completo la primera vez (idempotente por los IF NOT EXISTS)
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

module.exports = db;
