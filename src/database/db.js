const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'bot.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS master_channels (
    guild_id    TEXT NOT NULL,
    channel_id  TEXT NOT NULL UNIQUE,
    category_id TEXT,
    template    TEXT NOT NULL DEFAULT '%owner%のチャンネル',
    PRIMARY KEY (guild_id, channel_id)
  );

  CREATE TABLE IF NOT EXISTS temp_channels (
    channel_id        TEXT NOT NULL PRIMARY KEY,
    text_channel_id   TEXT,
    owner_id          TEXT NOT NULL,
    guild_id          TEXT NOT NULL,
    panel_message_id  TEXT,
    master_channel_id TEXT NOT NULL,
    is_locked         INTEGER NOT NULL DEFAULT 0,
    is_private        INTEGER NOT NULL DEFAULT 0,
    is_hidden         INTEGER NOT NULL DEFAULT 0,
    banned_users      TEXT    NOT NULL DEFAULT '[]'
  );
`);

// Schema migration: add new columns to existing databases
function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
addColumnIfMissing('temp_channels', 'is_locked',    'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('temp_channels', 'is_private',   'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('temp_channels', 'is_hidden',    'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('temp_channels', 'banned_users', "TEXT NOT NULL DEFAULT '[]'");

module.exports = db;
