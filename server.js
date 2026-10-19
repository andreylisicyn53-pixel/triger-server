const WebSocket = require('ws');

const PORT = process.env.PORT || 8085;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map();

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  ws.peerId = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  console.log('Client connected');

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (e) {
      console.warn('Bad JSON:', raw.toString());
      return;
    }

    if (msg.type === 'register') {
      const id = msg.id;
      if (!id) {
        send(ws, { type: 'error', payload: 'empty_id' });
        return;
      }
      const old = clients.get(id);
      if (old && old !== ws) {
        try { old.close(); } catch (e) { /* ignore */ }
      }
      ws.peerId = id;
      clients.set(id, ws);
      console.log(`Registered: ${id} (total ${clients.size})`);
      send(ws, { type: 'registered', id });
      return;
    }

    if (!msg.to) {
      send(ws, { type: 'error', payload: 'no_target' });
      return;
    }

    const target = clients.get(msg.to);
    if (target && target.readyState === WebSocket.OPEN) {
      const forwarded = Object.assign({}, msg, { from: ws.peerId || msg.from });
      send(target, forwarded);
    } else {
      console.log(`Target offline: ${msg.to} (from ${ws.peerId})`);
      send(ws, { type: 'error', to: msg.to, from: ws.peerId, payload: 'peer_offline' });
    }
  });

  ws.on('close', () => {
    if (ws.peerId && clients.get(ws.peerId) === ws) {
      clients.delete(ws.peerId);
      console.log(`Unregistered: ${ws.peerId} (total ${clients.size})`);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

console.log(`Triger signaling server listening on ws://0.0.0.0:${PORT}`);
