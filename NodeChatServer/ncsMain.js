import { WebSocketServer } from 'ws';
import sanitizeHtml from 'sanitize-html';

import { getMessages, getMessagesOf, postMessage, db } from './ncsRepo.js'
import { authMsg, registerUser, loginUser } from './ncsAuth.js'
import { ncsMessage } from './ncsDTO.js'

const PORT = process.env.PORT ?? 3005;
const RATE_LIMIT = 1000;
const MSG_MAX = 2055;
const allowedOrigins = ['https://bell-soft.co.uk', 'https://www.bell-soft.co.uk', "http://localhost:5173"];
console.log(allowedOrigins);
const wss = new WebSocketServer({ port: PORT, verifyClient: ({ origin }) => allowedOrigins.includes(origin) });
console.log("Chat server running on port " + PORT);

// message handling
const serialiseMsg = (type, data) => JSON.stringify({ type, data });

const sendMessages = (client) => {
    const messages = getMessagesOf(client.currentRoom);
    client.send(serialiseMsg("messages", messages));
}

const rateLimit = new Map();

const processMessage = async (json, client) => {
    let msg = {};
    try {
        msg = JSON.parse(json);
    }
    catch {
        console.warn("processMessage: message was not in json format", String(json));
        return client.close(1001, "message was not in json format");
    }


    const now = Date.now();
    const timestamps = rateLimit.get(client) ?? [];
    const recent = timestamps.filter(t => now - t < RATE_LIMIT);
    if (recent.length >= 5) return client.close(1008, 'Rate limited');
    rateLimit.set(client, [...recent, now]);

    if (msg.type === 'message') {
        if (!client.isAuthenticated) {
            console.warn("processMessage: client not authenticated");
            return;
        }

        if (!msg.data?.room || !msg.data?.user || !msg.data?.text) {
            console.warn("processMessage: msg.data missing required fields");
            return;
        }

        msg.data.room = sanitizeHtml(msg.data.room, { allowedTags: [], allowedAttributes: {} });
        msg.data.text = sanitizeHtml(msg.data.text, { allowedTags: [], allowedAttributes: {} });

        if (msg.data.room.length > MSG_MAX || msg.data.user.length > MSG_MAX || msg.data.text.length > MSG_MAX)
            return client.close(1009, 'Message too large');

        console.log(`Saving message: [${msg.data.room}] <${msg.data.user}>: ${msg.data.text}`);
        postMessage(msg.data);

        console.log(`Sending messages to all connected clients of room ${client.currentRoom}...`)
        wss.clients.forEach(c => {
            if (c.readyState === 1 && c.currentRoom === client.currentRoom) sendMessages(c);
        });
    }

    else if (msg.type === "room") {
        msg.data = sanitizeHtml(msg.data, { allowedTags: [], allowedAttributes: {} });
        client.currentRoom = msg.data;
        console.log(`Client moved to room: ${client.currentRoom}`);
        if (client.isAuthenticated) {
            let joinMsg = {
                room: client.currentRoom,
                user: "SYSTEM",
                text: client.alias + " has joined the room."
            }
            postMessage(joinMsg);
        }
        sendMessages(client);
    }

    else if (msg.type === 'login') {
        msg.data.username = sanitizeHtml(msg.data.username, { allowedTags: [], allowedAttributes: {} });
        const result = await loginUser(msg.data.username, msg.data.password);

        console.log(result);
        if (result.success) {
            client.isAuthenticated = true;
            client.alias = msg.data.username;
        }

        client.send(serialiseMsg('login_response', result));
    }

    else if (msg.type === 'reg') {
        msg.data.username = sanitizeHtml(msg.data.username, { allowedTags: [], allowedAttributes: {} });
        const result = await registerUser(msg.data.username, msg.data.password);

        if (result.success) {
            console.log(msg.data.username + " registered.");
            client.isAuthenticated = true;
            client.alias = msg.data.username;
        }
        else console.log(msg.data.username + " already taken.");

        client.send(serialiseMsg('reg_response', result));
    }
    else if (msg.type === 'logout') {
        client.isAuthenticated = false;
        client.alias = "";
    }
    else console.debug(msg);
}

const connect = (ws, req) => {
    console.log("Client connected: " + req.socket.remoteAddress);

    ws.on('message', (data) => processMessage(data, ws));

    const clientPing = setInterval(() => ws.ping(), 30_000);
    ws.on('close', () => {
        clearInterval(clientPing);
        rateLimit.delete(ws);
    });
}

wss.on('connection', connect)

const shutdown = () => {
    console.log("Shutting down...");
    wss.close();
    db().close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
