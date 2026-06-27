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
`);

try { db.exec("ALTER TABLE favorites ADD COLUMN collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL"); } catch(e) {}

module.exports = db;
