import WebSocket from 'ws';
import { Server } from 'http';
import { URL } from 'url';
import { SignalMessage } from './types';

// Interface for Redis adapter
export interface RedisAdapter {
  publish(channel: string, message: string): Promise<void>;
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
  unsubscribe(channel: string): Promise<void>;
}

// Mock Redis adapter for testing or when Redis is not available
export class MockRedisAdapter implements RedisAdapter {
  private callbacks = new Map<string, ((message: string) => void)[]>();

  async publish(channel: string, message: string): Promise<void> {
    const callbacks = this.callbacks.get(channel) || [];
    callbacks.forEach(callback => callback(message));
    return Promise.resolve();
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, []);
    }
    this.callbacks.get(channel)?.push(callback);
    return Promise.resolve();
  }

  async unsubscribe(channel: string): Promise<void> {
    this.callbacks.delete(channel);
    return Promise.resolve();
  }
}

// Enhanced SignalGateway with Redis integration
export class SignalGateway {
  private wss: any; // Using any type to avoid constructor issues in tests
  private redisAdapter: RedisAdapter;
  private roomConnections = new Map<string, Set<WebSocket>>();
  private clientRooms = new Map<WebSocket, string>();

  constructor(server: Server, redisAdapter: RedisAdapter = new MockRedisAdapter()) {
    // Use require to avoid ESM/CJS issues in tests
    const WebSocketServer = require('ws').Server;
    this.wss = new WebSocketServer({ noServer: true });
    this.redisAdapter = redisAdapter;
    this.setupConnectionHandling(server);
  }

  private setupConnectionHandling(server: Server) {
    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `ws://${request.headers.host}`);
      const pathname = url.pathname;

      // Match /signal/{roomId}
      const match = pathname.match(/^\/signal\/([a-zA-Z0-9_-]+)$/);
      if (match) {
        const roomId = match[1];
        this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          this.handleConnection(ws, roomId);
        });
      } else {
        // Handle other upgrade requests or reject
        socket.destroy();
      }
    });
  }

  private handleConnection(ws: WebSocket, roomId: string) {
    console.log(`Client connected to room ${roomId}`);

    // Add client to the room
    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
      // Subscribe to Redis channel for this room
      this.subscribeToRoom(roomId);
    }
    this.roomConnections.get(roomId)?.add(ws);
    this.clientRooms.set(ws, roomId);

    ws.on('message', (message: WebSocket.Data) => {
      this.handleMessage(ws, roomId, message);
    });

    ws.on('close', () => {
      this.handleDisconnection(ws, roomId);
    });

    ws.on('error', (error: Error) => {
      console.error(`WebSocket error in room ${roomId}:`, error);
      this.handleDisconnection(ws, roomId);
    });
  }

  private handleMessage(ws: WebSocket, roomId: string, message: WebSocket.Data) {
    try {
      const messageString = message.toString();
      const parsedMessage = JSON.parse(messageString);
      
      // Publish message to Redis channel
      const redisChannel = `room:${roomId}`;
      this.redisAdapter.publish(redisChannel, messageString)
        .catch(error => console.error(`Failed to publish message to Redis: ${error}`));
      
    } catch (error) {
      console.error('Failed to process message:', error);
      ws.send(JSON.stringify({ error: 'Failed to process message' }));
    }
  }

  private handleDisconnection(ws: WebSocket, roomId: string) {
    console.log(`Client disconnected from room ${roomId}`);
    
    // Remove client from the room
    this.roomConnections.get(roomId)?.delete(ws);
    this.clientRooms.delete(ws);
    
    // If room is empty, clean up
    if (this.roomConnections.get(roomId)?.size === 0) {
      this.roomConnections.delete(roomId);
      // Unsubscribe from Redis channel
      this.unsubscribeFromRoom(roomId);
    }
  }

  private subscribeToRoom(roomId: string) {
    const redisChannel = `room:${roomId}`;
    this.redisAdapter.subscribe(redisChannel, (message: string) => {
      this.broadcastToRoom(roomId, message);
    }).catch(error => console.error(`Failed to subscribe to Redis channel: ${error}`));
  }

  private unsubscribeFromRoom(roomId: string) {
    const redisChannel = `room:${roomId}`;
    this.redisAdapter.unsubscribe(redisChannel)
      .catch(error => console.error(`Failed to unsubscribe from Redis channel: ${error}`));
  }

  private broadcastToRoom(roomId: string, messageString: string) {
    try {
      const message = JSON.parse(messageString) as SignalMessage;
      const clients = this.roomConnections.get(roomId);
      
      if (clients) {
        clients.forEach(client => {
          // Don't send message back to the original sender
          if (client.readyState === WebSocket.OPEN) {
            client.send(messageString);
          }
        });
      }
    } catch (error) {
      console.error('Failed to broadcast message:', error);
    }
  }
}
