//to hold in db interaction
import Database from 'better-sqlite3';

const db = new Database('chat.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function getMessages() {
    let prep = db.prepare('SELECT user, text, timestamp FROM messages ORDER BY timestamp DESC LIMIT 50');
    return prep.all();
}

export function postMessage(user, text) {
    let prep = db.prepare('INSERT INTO messages (user, text) VALUES (?, ?)');
    prep.run(user, text);
}