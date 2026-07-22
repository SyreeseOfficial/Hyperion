import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const DB_DIR = path.join(os.homedir(), ".hyperion");
const DB_PATH = path.join(DB_DIR, "hyperion.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  runMigrations(_db);
  return _db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT    NOT NULL,
      provider    TEXT    NOT NULL,
      model       TEXT    NOT NULL,
      duration    INTEGER,          -- minutes
      tokens_in   INTEGER,
      tokens_out  INTEGER,
      cost        REAL,
      summary     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'backlog', -- backlog | todo | in_progress | done
      priority    TEXT    NOT NULL DEFAULT 'medium',  -- low | medium | high
      assignee    TEXT,
      due_date    TEXT,
      notes       TEXT,
      goal_id     INTEGER REFERENCES goals(id) ON DELETE SET NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS archived_tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      status      TEXT    NOT NULL,
      priority    TEXT    NOT NULL,
      assignee    TEXT,
      due_date    TEXT,
      notes       TEXT,
      goal_id     INTEGER,
      created_at  TEXT    NOT NULL,
      archived_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS time_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      started_at TEXT    NOT NULL,
      ended_at   TEXT,
      minutes    INTEGER, -- set on stop or manual entry
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT,
      target_date TEXT,
      status      TEXT    NOT NULL DEFAULT 'active', -- active | paused | complete
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      company      TEXT,
      email        TEXT,
      phone        TEXT,
      status       TEXT    NOT NULL DEFAULT 'prospect', -- prospect | active | cold | archived
      last_touched TEXT,
      notes        TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      type       TEXT    NOT NULL DEFAULT 'note', -- note | call | email | meeting | message
      text       TEXT    NOT NULL,
      next_step  TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_tasks (
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      PRIMARY KEY (contact_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS contact_goals (
      contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      goal_id    INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      PRIMARY KEY (contact_id, goal_id)
    );

    CREATE TABLE IF NOT EXISTS reading_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      url        TEXT    NOT NULL,
      title      TEXT,
      summary    TEXT,
      status     TEXT    NOT NULL DEFAULT 'pending', -- pending | summarizing | summarized | read | archived
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS briefings (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      content    TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL
    );
  `);
}
