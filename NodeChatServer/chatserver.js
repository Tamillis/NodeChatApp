import { WebSocketServer } from 'ws';
import {getMessages, postMessage} from './chatrepo'

const wss = new WebSocketServer({ port: 3000 });
console.log("Chat server running on port 3000!!!");

const serialiseMsg = (type, data) => JSON.stringify({ type, data });

wss.on('connection', (ws, req) => {
    console.log("Client connected: " + req.socket.remoteAddress);

    const sendMessages = (client) => {
        const messages = getMessages();
        client.send(serialiseMsg("messages", messages));
    }

    sendMessages(ws);

    ws.on('message', (json) => {
        const msg = JSON.parse(json);

        if (msg.type !== 'message') return;

        //save
        postMessage(msg.data.user, msg.data.text);

        // Broadcast all messages
        wss.clients.forEach(client => {
            if (client.readyState === 1) sendMessages(client);
        });
    });

    // Heartbeat to keep Cloudflare Tunnel open (every 45s)
    const ping = setInterval(() => ws.ping(), 45000);

    ws.on('close', () => clearInterval(ping));
})

const shutdown = () => {
    console.log("Shutting down...");
    wss.close();
    db.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
