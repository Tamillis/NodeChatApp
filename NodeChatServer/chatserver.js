import { WebSocketServer } from 'ws';
import { getMessages, postMessage } from './chatrepo.js'

const wss = new WebSocketServer({ port: 3000 });
console.log("Chat server running on port 3000!!!");

// message handling
const serialiseMsg = (type, data) => JSON.stringify({ type, data });

const sendMessages = (client) => {
    const messages = getMessages();
    client.send(serialiseMsg("messages", messages));
}

const truncateMsg = (msg) => msg.length > 25 ? msg.substring(0, 22) + "..." : msg;

const processMessage = (json) => {
        const msg = JSON.parse(json);

        if (msg.type !== 'message') return;

        console.log("Saving user " + msg.data.user.substring(0,5).toUpperCase() + "'s message '" + truncateMsg(msg.data.text) + "'");
        postMessage(msg.data.user, msg.data.text);

        console.log("Sending messages to all connected clients...")
        wss.clients.forEach(client => {
            if (client.readyState === 1) sendMessages(client);
        });
}

const connect = (ws, req) => {
    console.log("Client connected: " + req.socket.remoteAddress);
    console.log("Sending messages...")
    sendMessages(ws);

    ws.on('message', processMessage);

    // Heartbeat to keep Cloudflare Tunnel open (every 30s)
    const clientPing = setInterval(() => ws.ping(), 30_000);
    ws.on('close', () => clearInterval(clientPing));
}

wss.on('connection', connect)

const shutdown = () => {
    console.log("Shutting down...");
    wss.close();
    db.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
