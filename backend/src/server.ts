import WebSocket from 'ws';

const PORT = process.env.SIGNALING_PORT ? parseInt(process.env.SIGNALING_PORT, 10) : 4444;

// Store rooms: roomId -> Set of WebSocket connections
const rooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebRTC Signaling Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket, req) => {
  // Extract room ID from query parameter
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room') || 'default';
  
  console.log(`[${roomId}] New client connected`);

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  // Add client to room
  const room = rooms.get(roomId)!;
  room.add(ws);
  
  console.log(`[${roomId}] Clients in room: ${room.size}`);

  // Handle incoming messages
  ws.on('message', (message: WebSocket.Data) => {
    // Broadcast to all other clients in the same room (not back to sender)
    room.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log(`[${roomId}] Client disconnected`);
    room.delete(ws);
    
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`[${roomId}] Room cleaned up (empty)`);
    } else {
      console.log(`[${roomId}] Clients remaining in room: ${room.size}`);
    }
  });

  // Handle errors
  ws.on('error', (error: Error) => {
    console.error(`[${roomId}] WebSocket error:`, error);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down signaling server...');
  wss.close(() => {
    console.log('Signaling server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down signaling server...');
  wss.close(() => {
    console.log('Signaling server closed');
    process.exit(0);
  });
});

