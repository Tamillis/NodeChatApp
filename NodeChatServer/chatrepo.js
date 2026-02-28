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

let postMessagePrep = db.prepare('INSERT INTO messages (user, text) VALUES (?, ?)');
let getMessagesPrep = db.prepare('SELECT user, text, timestamp FROM messages ORDER BY timestamp DESC LIMIT 50');

export function getMessages() {
    return getMessagesPrep.all();
}

export function postMessage(user, text) {
    postMessagePrep.run(user, text);
}