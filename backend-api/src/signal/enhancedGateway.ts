// Enhanced SignalGateway implementation with Redis support
import WebSocket from 'ws';
import { Server } from 'http';
import { URL } from 'url';
import { SignalMessage, SignalMessageSchema } from './types';
import { RedisAdapter, MockRedisAdapter } from './redisAdapter';

export class SignalGateway {
  private wss: WebSocket.Server;
  private redisAdapter: RedisAdapter;
  private roomConnections = new Map<string, Set<WebSocket>>();
  private clientRooms = new Map<WebSocket, string>();
  private clientIds = new Map<WebSocket, string>();

  constructor(server: Server, redisAdapter: RedisAdapter = new MockRedisAdapter()) {
    this.wss = new WebSocket.Server({ noServer: true });
    this.redisAdapter = redisAdapter;
    this.setupConnectionHandling(server);
    this.setupRedisSubscriptions();
  }

  private setupConnectionHandling(server: Server) {
    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `ws://${request.headers.host}`);
      const pathname = url.pathname;

      // Match /signal/{roomId}
      const match = pathname.match(/^\/signal\/([a-zA-Z0-9_-]+)$/);
      if (match) {
        const roomId = match[1];
        
        // Extract client ID from query parameters
        const clientId = url.searchParams.get('clientId');
        if (!clientId) {
          console.error('Client ID is required');
          socket.destroy();
          return;
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, roomId, clientId);
        });
      } else {
        // Handle other upgrade requests or reject
        socket.destroy();
      }
    });
  }

  private handleConnection(ws: WebSocket, roomId: string, clientId: string) {
    console.log(`Client ${clientId} connected to room ${roomId}`);

    // Store client ID
    this.clientIds.set(ws, clientId);

    // Add client to the room
    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
      // Subscribe to Redis channel for this room
      this.subscribeToRoom(roomId);
    }
    this.roomConnections.get(roomId)?.add(ws);
    this.clientRooms.set(ws, roomId);

    // Send a connection confirmation message
    ws.send(JSON.stringify({
      type: 'system',
      event: 'connected',
      roomId,
      clientId,
      timestamp: Date.now()
    }));

    // Broadcast a user-joined message to other clients in the room
    this.broadcastSystemMessage(roomId, {
      type: 'system',
      event: 'user-joined',
      roomId,
      clientId,
      timestamp: Date.now()
    }, ws);

    ws.on('message', (message: WebSocket.Data) => {
      this.handleMessage(ws, roomId, clientId, message);
    });

    ws.on('close', () => {
      this.handleDisconnection(ws, roomId, clientId);
    });

    ws.on('error', (error: Error) => {
      console.error(`WebSocket error for client ${clientId} in room ${roomId}:`, error);
      this.handleDisconnection(ws, roomId, clientId);
    });
  }

  private handleMessage(ws: WebSocket, roomId: string, clientId: string, message: WebSocket.Data) {
    try {
      const rawMessage = message.toString();
      const parsedMessage: unknown = JSON.parse(rawMessage);

      // Validate message against schema
      const validationResult = SignalMessageSchema.safeParse(parsedMessage);

      if (!validationResult.success) {
        console.error('Invalid signal message received:', validationResult.error);
        // Send an error back to the client
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Invalid message format', 
          details: validationResult.error.flatten() 
        }));
        return;
      }

      const signalMessage: SignalMessage = validationResult.data;
      
      // Ensure the sender ID matches the client ID
      if (signalMessage.senderId !== clientId) {
        console.error(`Message sender ID mismatch: ${signalMessage.senderId} vs ${clientId}`);
        ws.send(JSON.stringify({ 
          type: 'error', 
          error: 'Sender ID mismatch' 
        }));
        return;
      }

      console.log(`Received message in room ${roomId} from ${clientId}:`, signalMessage.type);
      
      // Publish message to Redis channel for distribution to other server instances
      const redisChannel = `room:${roomId}`;
      this.redisAdapter.publish(redisChannel, JSON.stringify({
        ...signalMessage,
        _originClientId: clientId
      })).catch(error => console.error(`Failed to publish message to Redis: ${error}`));
      
      // Also broadcast to local clients
      this.broadcastToRoom(roomId, signalMessage, ws);

    } catch (error) {
      console.error('Failed to process message:', error);
      ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
    }
  }

  private handleDisconnection(ws: WebSocket, roomId: string, clientId: string) {
    console.log(`Client ${clientId} disconnected from room ${roomId}`);
    
    // Remove client from the room
    this.roomConnections.get(roomId)?.delete(ws);
    this.clientRooms.delete(ws);
    this.clientIds.delete(ws);
    
    // Broadcast a user-left message to other clients in the room
    this.broadcastSystemMessage(roomId, {
      type: 'system',
      event: 'user-left',
      roomId,
      clientId,
      timestamp: Date.now()
    });
    
    // If room is empty, clean up
    if (this.roomConnections.get(roomId)?.size === 0) {
      this.roomConnections.delete(roomId);
      // Unsubscribe from Redis channel
      this.unsubscribeFromRoom(roomId);
    }
  }

  private setupRedisSubscriptions() {
    // Listen for Redis connection events
    if (this.redisAdapter instanceof MockRedisAdapter) {
      console.log('Using mock Redis adapter - no external subscriptions needed');
    } else {
      console.log('Setting up Redis adapter for signaling');
    }
  }

  private subscribeToRoom(roomId: string) {
    const redisChannel = `room:${roomId}`;
    this.redisAdapter.subscribe(redisChannel, (message: string) => {
      try {
        const parsedMessage = JSON.parse(message);
        const originClientId = parsedMessage._originClientId;
        
        // Remove the internal _originClientId field before broadcasting
        delete parsedMessage._originClientId;
        
        // Broadcast to all local clients except the originator
        const clients = this.roomConnections.get(roomId);
        if (clients) {
          clients.forEach(client => {
            const clientId = this.clientIds.get(client);
            // Don't send message back to the original sender
            if (clientId !== originClientId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(parsedMessage));
            }
          });
        }
      } catch (error) {
        console.error('Failed to process Redis message:', error);
      }
    }).catch(error => console.error(`Failed to subscribe to Redis channel: ${error}`));
  }

  private unsubscribeFromRoom(roomId: string) {
    const redisChannel = `room:${roomId}`;
    this.redisAdapter.unsubscribe(redisChannel)
      .catch(error => console.error(`Failed to unsubscribe from Redis channel: ${error}`));
  }

  // Broadcast message to all clients in the room except the sender
  private broadcastToRoom(roomId: string, message: SignalMessage, sender?: WebSocket) {
    const roomClients = this.roomConnections.get(roomId);
    if (roomClients) {
      const messageString = JSON.stringify(message);
      roomClients.forEach((client) => {
        // Check if client is not the sender and is ready to receive messages
        if ((!sender || client !== sender) && client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  }

  // Broadcast system message to all clients in the room except the sender
  private broadcastSystemMessage(roomId: string, message: any, sender?: WebSocket) {
    const roomClients = this.roomConnections.get(roomId);
    if (roomClients) {
      const messageString = JSON.stringify(message);
      roomClients.forEach((client) => {
        // Check if client is not the sender and is ready to receive messages
        if ((!sender || client !== sender) && client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  }

  // Get active rooms
  public getActiveRooms(): string[] {
    return Array.from(this.roomConnections.keys());
  }

  // Get clients in a room
  public getClientsInRoom(roomId: string): string[] {
    const clients = this.roomConnections.get(roomId);
    if (!clients) return [];
    
    return Array.from(clients)
      .map(client => this.clientIds.get(client))
      .filter((id): id is string => id !== undefined);
  }
}
