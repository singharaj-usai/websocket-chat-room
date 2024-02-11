let ws;
const reconnectInterval = 5000; // 5 seconds reconnect

const connectWebSocket = () => {
    ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'room', room: 'roomba' }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'chat') {
            feedback.innerHTML = '';
            output.innerHTML += `<p><strong>${data.handle}: </strong>${data.message}</p>`;
        } else if (data.type === 'typing') {
            feedback.innerHTML = `<em>${data.handle} is typing...</em>`;
        }
    };

    ws.onclose = () => {
        console.log("WebSocket closed. Reconnecting...");
        setTimeout(connectWebSocket, reconnectInterval);
    };

    ws.onerror = (err) => {
        console.error("WebSocket error observed:", err);
        ws.close();
    };
};

connectWebSocket();

const message = document.getElementById('message');
const handle = document.getElementById('handle');
const btn = document.getElementById('send');
const output = document.getElementById('output');
const feedback = document.getElementById('feedback');

btn.addEventListener('click', () => {
    ws.send(JSON.stringify({
        type: 'chat',
        message: message.value,
        handle: handle.value
    }));
    message.value = '';
});

message.addEventListener('keypress', () => {
    ws.send(JSON.stringify({ type: 'typing', handle: handle.value }));
});
