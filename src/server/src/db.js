const path = require('path');

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id {{SERIAL}},
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS curtains (
    id {{SERIAL}},
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
    tier_id INTEGER,
    created_at TEXT DEFAULT ({{NOW}}),
    updated_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS curtain_colors (
    id {{SERIAL}},
    curtain_id INTEGER NOT NULL,
    color_name TEXT NOT NULL,
    color_code TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS curtain_media (
    id {{SERIAL}},
    curtain_id INTEGER NOT NULL,
    color_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('image','video')),
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS category_options (
    id {{SERIAL}},
    dimension TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id {{SERIAL}},
    curtain_id INTEGER NOT NULL,
    collection_id INTEGER,
    created_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS collections (
    id {{SERIAL}},
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS orders (
    id {{SERIAL}},
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
    created_at TEXT DEFAULT ({{NOW}}),
    updated_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id {{SERIAL}},
    order_id INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    space TEXT NOT NULL,
    curtain_id INTEGER,
    color_id INTEGER,
    width REAL,
    height REAL,
    quantity INTEGER DEFAULT 1,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS order_status_log (
    id {{SERIAL}},
    order_id INTEGER NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT ({{NOW}})
  );

  CREATE TABLE IF NOT EXISTS price_tiers (
    id {{SERIAL}},
    name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT ({{NOW}}),
    updated_at TEXT DEFAULT ({{NOW}})
  );
`;

const MIGRATIONS = [
  `ALTER TABLE favorites ADD COLUMN collection_id INTEGER`,
  `ALTER TABLE curtains ADD COLUMN deleted_at TEXT`,
  `ALTER TABLE curtains ADD COLUMN tier_id INTEGER`,
];

function convertSql(sql) {
  let idx = 0;
  return sql
    .replace(/\?/g, () => `$${++idx}`)
    .replace(/datetime\('now'\)/gi, 'NOW()');
}

function isInsert(sql) {
  return /^\s*INSERT\s/i.test(sql.trim());
}

// ====== PostgreSQL adapter ======
function createPgDb(pool) {
  class PgStatement {
    constructor(clientOrPool, sql) {
      this.queryFn = (params) => clientOrPool.query(sql, params || []);
      this.sql = sql;
      this.isInsert = isInsert(sql);
    }
    async run(...params) {
      const finalSql = this.isInsert ? this.sql + ' RETURNING id' : this.sql;
      const result = await this.queryFn(finalSql, params);
      return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id ?? null };
    }
    async get(...params) {
      const result = await this.queryFn(this.sql, params);
      return result.rows[0] || null;
    }
    async all(...params) {
      const result = await this.queryFn(this.sql, params);
      return result.rows;
    }
  }

  const db = {
    prepare(sql) { return new PgStatement(pool, sql); },
    transaction(fn) {
      return async (...args) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const txnDb = {
            prepare(sql) { return new PgStatement(client, sql); }
          };
          const result = await fn(txnDb, ...args);
          await client.query('COMMIT');
          return result;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      };
    }
  };

  async function migrate() {
    const sql = SCHEMA_SQL.replace(/\{\{SERIAL\}\}/g, 'SERIAL PRIMARY KEY').replace(/\{\{NOW\}\}/g, 'NOW()');
    await pool.query(sql);
  }

  return { db, migrate, type: 'pg' };
}

// ====== SQLite adapter ======
function createSqliteDb(sqlite) {
  class SqliteStatement {
    constructor(sql) {
      this.sql = sql;
      this.isInsert = isInsert(sql);
    }
    run(...params) {
      const stmt = sqlite.prepare(this.sql);
      const result = params.length > 0 ? stmt.run(...params) : stmt.run();
      return Promise.resolve({ changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) });
    }
    get(...params) {
      const stmt = sqlite.prepare(this.sql);
      return Promise.resolve(params.length > 0 ? stmt.get(...params) : stmt.get() || null);
    }
    all(...params) {
      const stmt = sqlite.prepare(this.sql);
      return Promise.resolve(params.length > 0 ? stmt.all(...params) : stmt.all());
    }
  }

  const db = {
    prepare(sql) { return new SqliteStatement(sql); },
    transaction(fn) {
      return async (...args) => {
        sqlite.exec('BEGIN');
        try {
          // For SQLite, wrap the adapter so txnDb.prepare returns SqliteStatement
          const txnDb = { prepare(sql) { return new SqliteStatement(sql); } };
          const result = await fn(txnDb, ...args);
          sqlite.exec('COMMIT');
          return result;
        } catch (e) {
          sqlite.exec('ROLLBACK');
          throw e;
        }
      };
    }
  };

  async function migrate() {
    const sql = SCHEMA_SQL.replace(/\{\{SERIAL\}\}/g, 'INTEGER PRIMARY KEY AUTOINCREMENT').replace(/\{\{NOW\}\}/g, "datetime('now')");
    sqlite.exec(sql);
    for (const m of MIGRATIONS) {
      try { sqlite.exec(m); } catch (e) { /* ignore if column exists */ }
    }
  }

  return { db, migrate, type: 'sqlite' };
}

// ====== Init ======
let adapter;

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  adapter = createPgDb(pool);
} else {
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '..', 'data.db');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.function('NOW', { deterministic: true }, () => new Date().toISOString().replace('T', ' ').split('.')[0]);
  adapter = createSqliteDb(sqlite);
}

module.exports = adapter.db;
module.exports.migrate = adapter.migrate;
module.exports.type = adapter.type;
