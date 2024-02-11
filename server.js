const express = require('express');
const { WebSocket, WebSocketServer } = require('ws');
const path = require('path');
const http = require('http');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, './client')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = {}; // Format: { roomName: [ws1, ws2, ...], ... }

wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    ws.on('message', (data) => {
        const message = JSON.parse(data);

        switch (message.type) {
            case 'room':
                const roomName = message.room;
                if (!rooms[roomName]) {
                    rooms[roomName] = new Set();
                }
                rooms[roomName].add(ws);
                ws.roomName = roomName; // track the room name on the websocket object
                break;
            case 'chat':
            case 'typing':
                if (ws.roomName && rooms[ws.roomName]) {
                    rooms[ws.roomName].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(data);
                        }
                    });
                }
                break;
        }
    });

    ws.on('close', () => {
        if (ws.roomName && rooms[ws.roomName]) {
            rooms[ws.roomName].delete(ws); // remove from room on disconnect
        }
    });

    const heartbeat = () => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    };

    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);
    setInterval(heartbeat, 30000); // 30 seconds
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
