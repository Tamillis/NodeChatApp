//to hold in _db interaction
import Database from 'better-sqlite3';

const _db = new Database('chat._db');
_db.pragma('journal_mode = WAL');

_db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    room TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

_db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    name TEXT PRIMARY KEY UNIQUE,
    password_hash TEXT
  )
`);

let postMessagePrep = _db.prepare('INSERT INTO messages (user, text, room) VALUES (?, ?, ?)');
let getMessagesPrep = _db.prepare('SELECT user, text, room, timestamp FROM messages ORDER BY timestamp DESC LIMIT 50');
let getMessagesOfPrep = _db.prepare('SELECT user, text, room, timestamp FROM messages WHERE LOWER(room) = LOWER(?) ORDER BY timestamp DESC LIMIT 50');
let insertUserPrep = _db.prepare('INSERT INTO users (name, password_hash) VALUES (?, ?)');
let getUserPrep = _db.prepare('SELECT password_hash FROM users WHERE name = ?');

export function getMessages() {
    return getMessagesPrep.all();
}

export function getMessagesOf(room) {
  if (!room) {
    console.warn("getMessagesOf: param room blank");
    return [];
  }
  return getMessagesOfPrep.all([room]);
}

export function postMessage(msg) {
    postMessagePrep.run(msg.user, msg.text, msg.room);
}

export function insertUser(user, hash) {
    insertUserPrep.run(user, hash);
}

export function getUser(user) {
  return getUserPrep.all([user])[0];
}

export function db() {
  return _db;
}