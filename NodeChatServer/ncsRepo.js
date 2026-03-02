//to hold in db interaction
import Database from 'better-sqlite3';

const db = new Database('chat.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    room TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    user TEXT PRIMARY KEY,
    passwordHash TEXT
  )
`);

let postMessagePrep = db.prepare('INSERT INTO messages (user, text, room) VALUES (?, ?, ?)');
let getMessagesPrep = db.prepare('SELECT user, text, room, timestamp FROM messages ORDER BY timestamp DESC LIMIT 50');
let getMessagesOfPrep = db.prepare('SELECT user, text, room, timestamp FROM messages WHERE LOWER(room) = LOWER(?) ORDER BY timestamp DESC LIMIT 50');

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