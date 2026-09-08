import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'rikar.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = process.env.UPLOADS_DIR || path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export { uploadsDir };

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

function prepare(sql) {
  const stmt = db.prepare(sql);
  return {
    run(...params) {
      stmt.run(...params);
      return { lastInsertRowid: db.prepare('SELECT last_insert_rowid() as id').get().id };
    },
    get(...params) {
      return stmt.get(...params);
    },
    all(...params) {
      return stmt.all(...params);
    },
  };
}

const dbApi = {
  exec(sql) {
    db.exec(sql);
  },
  prepare,
};

function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

function addColumn(table, column, definition) {
  if (!columnExists(table, column)) {
    dbApi.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function migrateV2() {
  addColumn('rentals', 'coverage_type', "TEXT NOT NULL DEFAULT 'none'");
  addColumn('rentals', 'coverage_amount', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('rentals', 'delivered_at', 'TEXT');
  addColumn('rentals', 'returned_at', 'TEXT');
  addColumn('rentals', 'actual_return_at', 'TEXT');
  addColumn('rentals', 'return_notes', 'TEXT');
  addColumn('rentals', 'return_anomaly', 'INTEGER NOT NULL DEFAULT 0');

  addColumn('incidents', 'incident_code', 'TEXT');
  addColumn('incidents', 'priority', "TEXT NOT NULL DEFAULT 'normal'");
  addColumn('incidents', 'location', 'TEXT');
  addColumn('incidents', 'vehicle_state', 'TEXT');
  addColumn('incidents', 'metadata', 'TEXT');
  addColumn('incidents', 'created_by', 'TEXT');
  addColumn('incidents', 'updated_at', "TEXT NOT NULL DEFAULT (datetime('now'))");
  addColumn('incidents', 'settled_at', 'TEXT');

  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS incident_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      note TEXT,
      actor TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incident_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'photo',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incident_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      amount INTEGER NOT NULL,
      charge_type TEXT NOT NULL DEFAULT 'fee',
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incident_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      decision_type TEXT NOT NULL,
      amount INTEGER,
      note TEXT,
      decided_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_rental ON incidents(rental_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incident_history ON incident_status_history(incident_id);
  `);

  db.prepare(`
    UPDATE incidents SET status = 'submitted'
    WHERE status = 'open'
  `).run();

  db.prepare(`
    UPDATE incidents SET incident_code = 'INC-' || printf('%05d', id)
    WHERE incident_code IS NULL OR incident_code = ''
  `).run();
}

export function initDb() {
  dbApi.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      kyc_status TEXT NOT NULL DEFAULT 'not_submitted',
      kyc_file_path TEXT,
      kyc_rejection_reason TEXT,
      kyc_reviewed_at TEXT,
      kyc_reviewed_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trim TEXT,
      base_price INTEGER NOT NULL,
      extra_price INTEGER NOT NULL,
      seats INTEGER DEFAULT 5,
      fuel TEXT,
      gear TEXT,
      km TEXT,
      color TEXT,
      image_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vehicle_id TEXT NOT NULL,
      purpose TEXT,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      hours INTEGER NOT NULL,
      base_price INTEGER NOT NULL,
      extra_blocks INTEGER NOT NULL DEFAULT 0,
      extra_unit_price INTEGER NOT NULL DEFAULT 0,
      total_amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      reservation_code TEXT UNIQUE,
      hold_expires_at TEXT,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      payment_ref TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rental_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'submitted',
      assignee TEXT,
      incident_code TEXT,
      priority TEXT NOT NULL DEFAULT 'normal',
      location TEXT,
      vehicle_state TEXT,
      metadata TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      settled_at TEXT,
      FOREIGN KEY (rental_id) REFERENCES rentals(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rentals_user ON rentals(user_id);
    CREATE INDEX IF NOT EXISTS idx_rentals_vehicle ON rentals(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_at, end_at);
    CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
  `);

  migrateV2();
}

export default dbApi;
