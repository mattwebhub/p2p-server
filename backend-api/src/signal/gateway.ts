import WebSocket from 'ws';
import { Server } from 'http';
import { URL } from 'url';
import { SignalMessage, SignalMessageSchema } from './types';

// Store connections per room
const rooms = new Map<string, Set<WebSocket>>();

export class SignalGateway {
  private wss: WebSocket.Server;

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ noServer: true });
    this.setupConnectionHandling(server);
    this.setupMessageHandling();
  }

  private setupConnectionHandling(server: Server) {
    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `ws://${request.headers.host}`);
      const pathname = url.pathname;

      // Match /signal/{roomId}
      const match = pathname.match(/^\/signal\/([a-zA-Z0-9_-]+)$/);
      if (match) {
        const roomId = match[1];
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, roomId);
        });
      } else {
        // Handle other upgrade requests or reject
        socket.destroy();
      }
    });
  }

  private setupMessageHandling() {
    this.wss.on('connection', (ws: WebSocket, request: any, roomId: string) => {
      console.log(`Client connected to room ${roomId}`);

      // Add client to the room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)?.add(ws);

      ws.on('message', (message: WebSocket.Data) => {
        try {
          const rawMessage = message.toString();
          const parsedMessage: unknown = JSON.parse(rawMessage);

          // Validate message against schema
          const validationResult = SignalMessageSchema.safeParse(parsedMessage);

          if (!validationResult.success) {
            console.error('Invalid signal message received:', validationResult.error);
            // Optionally send an error back to the client
            ws.send(JSON.stringify({ error: 'Invalid message format', details: validationResult.error.flatten() }));
            return;
          }

          const signalMessage: SignalMessage = validationResult.data;
          console.log(`Received message in room ${roomId}:`, signalMessage);

          // Broadcast message to other clients in the same room
          this.broadcast(roomId, ws, signalMessage);

        } catch (error) {
          console.error('Failed to process message:', error);
          ws.send(JSON.stringify({ error: 'Failed to process message' }));
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected from room ${roomId}`);
        // Remove client from the room
        rooms.get(roomId)?.delete(ws);
        if (rooms.get(roomId)?.size === 0) {
          rooms.delete(roomId);
        }
        // Optionally broadcast a 'user-left' message
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error in room ${roomId}:`, error);
        // Clean up connection
        rooms.get(roomId)?.delete(ws);
        if (rooms.get(roomId)?.size === 0) {
          rooms.delete(roomId);
        }
      });
    });
  }

  // Broadcast message to all clients in the room except the sender
  private broadcast(roomId: string, sender: WebSocket, message: SignalMessage) {
    const roomClients = rooms.get(roomId);
    if (roomClients) {
      const messageString = JSON.stringify(message);
      roomClients.forEach((client) => {
        // Check if client is not the sender and is ready to receive messages
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  }
}
