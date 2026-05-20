const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('berrones.db');

async function migrate() {
  console.log('--- Starting Migration ---');

  // Disable foreign keys temporarily for the table swap
  db.pragma('foreign_keys = OFF');

  // Create new table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS empleados_new (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario     TEXT    UNIQUE,
      password    TEXT,
      nombre      TEXT    NOT NULL,
      rol         TEXT    NOT NULL DEFAULT 'Empleado'
                          CHECK(rol IN ('Empleado','Gerente','Admin')),
      telefono    TEXT,
      email       TEXT,
      horario     TEXT,
      salario     REAL    NOT NULL DEFAULT 0,
      estado      TEXT    NOT NULL DEFAULT 'Activo'
                          CHECK(estado IN ('Activo','Inactivo','Vacaciones')),
      pin         TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
  `).run();

  // Get current employees
  const currentEmployees = db.prepare(`SELECT * FROM empleados`).all();
  
  const insertStmt = db.prepare(`
    INSERT INTO empleados_new (id, usuario, password, nombre, rol, telefono, email, horario, salario, estado, pin, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const saltRounds = 10;
  const defaultPassword = await bcrypt.hash('1234', saltRounds);

  for (const emp of currentEmployees) {
    // Generate a basic username based on name (e.g., "Miguel Torres" -> "mtorres")
    // Keep it simple: first letter of first name + last name
    const parts = emp.nombre.trim().split(' ');
    let username = '';
    if (parts.length > 1) {
      username = (parts[0].charAt(0) + parts[parts.length - 1]).toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      username = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    // Ensure uniqueness manually just in case
    let finalUsername = username;
    let counter = 1;
    while (true) {
      const exists = db.prepare(`SELECT id FROM empleados_new WHERE usuario = ?`).get(finalUsername);
      if (!exists) break;
      finalUsername = username + counter;
      counter++;
    }

    // Map old roles to new roles
    let newRol = emp.rol;
    if (newRol === 'Cajero' || newRol === 'Almacén') newRol = 'Empleado';

    insertStmt.run(
      emp.id,
      finalUsername,
      defaultPassword,
      emp.nombre,
      newRol,
      emp.telefono,
      emp.email,
      emp.horario,
      emp.salario,
      emp.estado,
      emp.pin,
      emp.created_at
    );
    console.log(`Migrated employee: ${emp.nombre} -> username: ${finalUsername}, rol: ${newRol}`);
  }

  // Swap tables
  db.prepare(`DROP TABLE empleados`).run();
  db.prepare(`ALTER TABLE empleados_new RENAME TO empleados`).run();

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  console.log('--- Migration Completed Successfully ---');
}

migrate().catch(console.error);
