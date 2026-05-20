-- ============================================================
--  BERRONES POS — Schema SQLite
--  Orden: Proveedores → Empleados → Productos → Facturas
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;   -- mejor concurrencia lectura/escritura

-- ── 1. Proveedores ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  contacto    TEXT,
  telefono    TEXT,
  email       TEXT,
  direccion   TEXT,
  categoria   TEXT    DEFAULT 'General',
  estado      TEXT    NOT NULL DEFAULT 'Activo'
                      CHECK(estado IN ('Activo','Inactivo')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ── 2. Empleados ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empleados (
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
  pin         TEXT,                         -- PIN de 4 dígitos para login
  created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ── 3. Productos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo        TEXT    NOT NULL UNIQUE,           -- 4 dígitos
  nombre        TEXT    NOT NULL,
  precio_venta  REAL    NOT NULL DEFAULT 0,
  precio_costo  REAL    NOT NULL DEFAULT 0,
  stock_actual  INTEGER NOT NULL DEFAULT 0,
  stock_minimo  INTEGER NOT NULL DEFAULT 5,
  proveedor_id  INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
  unidad        TEXT    NOT NULL DEFAULT 'pza',    -- pza, kg, lt…
  activo        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);

-- trigger: actualiza updated_at automáticamente al editar un producto
CREATE TRIGGER IF NOT EXISTS trg_productos_updated_at
  AFTER UPDATE ON productos
  FOR EACH ROW
BEGIN
  UPDATE productos SET updated_at = datetime('now','localtime')
  WHERE id = OLD.id;
END;

-- ── 4. Facturas (cabecera) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha        TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  total        REAL    NOT NULL DEFAULT 0,
  subtotal     REAL    NOT NULL DEFAULT 0,
  iva          REAL    NOT NULL DEFAULT 0,
  empleado_id  INTEGER REFERENCES empleados(id) ON DELETE SET NULL,
  metodo_pago  TEXT    NOT NULL DEFAULT 'Efectivo'
                       CHECK(metodo_pago IN ('Efectivo','Tarjeta','Transferencia')),
  notas        TEXT
);

CREATE INDEX IF NOT EXISTS idx_facturas_fecha      ON facturas(fecha);
CREATE INDEX IF NOT EXISTS idx_facturas_empleado   ON facturas(empleado_id);

-- ── 5. Detalle Factura (cuerpo) ───────────────────────────────
--   precio_unitario se COPIA en el momento de la venta para preservar
--   el historial aunque el precio del producto cambie después.
CREATE TABLE IF NOT EXISTS detalle_factura (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id       INTEGER NOT NULL REFERENCES facturas(id)  ON DELETE CASCADE,
  producto_id      INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad         INTEGER NOT NULL DEFAULT 1,
  precio_unitario  REAL    NOT NULL,            -- snapshot del precio al vender
  subtotal         REAL    GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

CREATE INDEX IF NOT EXISTS idx_detalle_factura_id   ON detalle_factura(factura_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto_id  ON detalle_factura(producto_id);

-- ============================================================
--  DATOS INICIALES (seed)
-- ============================================================

INSERT OR IGNORE INTO proveedores (id, nombre, contacto, telefono, categoria, estado) VALUES
  (1, 'Grupo Lala',           'Carlos Méndez',   '618-123-4567', 'Lácteos',   'Activo'),
  (2, 'Bimbo S.A. de C.V.',   'Ana Ramírez',     '800-246-2626', 'Panadería', 'Activo'),
  (3, 'Distribuidora Alfa',   'Roberto Torres',  '618-987-0011', 'General',   'Inactivo'),
  (4, 'Bebidas del Norte',    'Luisa Fernández', '618-555-3344', 'Bebidas',   'Activo');

INSERT OR IGNORE INTO empleados (id, nombre, rol, horario, salario, estado, pin) VALUES
  (1, 'Laura Gutiérrez',     'Gerente', 'Lun–Vie 9–17h',  18000, 'Activo',    '0000'),
  (2, 'Miguel Ángel Torres', 'Cajero',  'Lun–Vie 8–16h',  8500,  'Activo',    '1234'),
  (3, 'Sofía Ramírez',       'Cajero',  'Lun–Sáb 14–22h', 8500,  'Activo',    '5678'),
  (4, 'Jorge Hernández',     'Almacén', 'Lun–Vie 7–15h',  9000,  'Vacaciones','9999');

INSERT OR IGNORE INTO productos
  (id, codigo, nombre, precio_venta, precio_costo, stock_actual, stock_minimo, proveedor_id, unidad) VALUES
  (1, '1001', 'Leche Entera 1L',     22.50, 17.00, 48, 10, 1, 'pza'),
  (2, '1002', 'Pan de Caja Bimbo',   38.00, 28.00, 12, 15, 2, 'pza'),
  (3, '1003', 'Huevo kg',            65.00, 52.00, 30, 10, 3, 'kg'),
  (4, '1004', 'Aceite Nutrioli 1L',  48.00, 36.00,  5,  8, 3, 'pza'),
  (5, '2001', 'Refresco 600ml',      18.50, 12.00, 72, 20, 4, 'pza'),
  (6, '2002', 'Jabón Palmolive',     26.00, 18.00, 18, 10, 3, 'pza');
