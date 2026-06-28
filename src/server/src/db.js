const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS curtains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    material_id INTEGER,
    style_id INTEGER,
    light_level_id INTEGER,
    space_id INTEGER,
    size_range TEXT,
    description TEXT,
    status TEXT DEFAULT 'active',
    deleted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS curtain_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curtain_id INTEGER NOT NULL,
    color_name TEXT NOT NULL,
    color_code TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (curtain_id) REFERENCES curtains(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS curtain_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curtain_id INTEGER NOT NULL,
    color_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('image','video')),
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (curtain_id) REFERENCES curtains(id) ON DELETE CASCADE,
    FOREIGN KEY (color_id) REFERENCES curtain_colors(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS category_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dimension TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curtain_id INTEGER NOT NULL,
    collection_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (curtain_id) REFERENCES curtains(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_phone TEXT NOT NULL,
    community TEXT NOT NULL,
    building TEXT,
    unit TEXT,
    room TEXT,
    address_detail TEXT,
    status TEXT DEFAULT 'new' CHECK(status IN ('new','confirmed','producing','completed','delivered')),
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    space TEXT NOT NULL,
    curtain_id INTEGER,
    color_id INTEGER,
    width REAL,
    height REAL,
    quantity INTEGER DEFAULT 1,
    note TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (curtain_id) REFERENCES curtains(id) ON DELETE SET NULL,
    FOREIGN KEY (color_id) REFERENCES curtain_colors(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS order_status_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

try { db.exec("ALTER TABLE favorites ADD COLUMN collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL"); } catch(e) {}
try { db.exec("ALTER TABLE curtains ADD COLUMN deleted_at TEXT"); } catch(e) {}

module.exports = db;
