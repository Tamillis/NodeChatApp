import { WebSocketServer } from 'ws';
import { getMessages, getMessagesOf, postMessage } from './ncsRepo.js'
import { authMsg, registerUser, loginUser } from './ncsAuth.js'
import { ncsMessage } from './ncsDTO.js'

const wss = new WebSocketServer({ port: 3000 });
console.log("Chat server running on port 3000!!!");

// message handling
const serialiseMsg = (type, data) => JSON.stringify({ type, data });

const sendMessages = (client) => {
    const messages = getMessagesOf(client.currentRoom);
    client.send(serialiseMsg("messages", messages));
}

const truncateMsg = (msg) => msg.length > 25 ? msg.substring(0, 22) + "..." : msg;

const processMessage = (json, client) => {
    const msg = JSON.parse(json);

    if (msg.type == 'message') {
        if (!msg.data instanceof ncsMessage) {
            console.warn("processMessage: msg.data not of class ncsMessage");
            return;
        }

        console.log(`Saving message: [${msg.data.room}] <${msg.data.user}>: ${msg.data.text}`);
        postMessage(msg.data);

        console.log(`Sending messages to all connected clients of room ${client.currentRoom}...`)
        wss.clients.forEach(c => {
            if (c.readyState === 1 && c.currentRoom === client.currentRoom) sendMessages(client);
        });
    }

    else if (msg.type == "room") {
        client.currentRoom = msg.data;
        console.log(`Client moved to room: ${client.currentRoom}`);
        sendMessages(client);
    }

    else if (msg.type === 'login') {
        //TODO: check this

        const result = loginUser(msg.data.username, msg.data.password);
        client.send(JSON.stringify({
            type: 'auth_response',
            data: { ...result, alias: msg.data.username }
        }));
    }

    else if (msg.type === 'register') {
        //TODO: check this

        const result = registerUser(msg.data.username, msg.data.password);
        client.send(JSON.stringify({ type: 'reg_response', data: result }));
    }

    else console.debug(msg);
}

const connect = (ws, req) => {
    console.log("Client connected: " + req.socket.remoteAddress);

    ws.on('message', (data) => processMessage(data, ws));

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
