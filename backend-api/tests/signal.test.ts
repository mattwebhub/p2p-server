import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from 'http';
import WebSocket from 'ws';
import { AddressInfo } from 'net';
import { SignalGateway } from '../src/signal/redisAdapter';
import { MockRedisAdapter } from '../src/signal/redisAdapter';
import express from 'express';

describe('SignalGateway with Redis Adapter', () => {
  let server: Server;
  let signalGateway: SignalGateway;
  let redisAdapter: MockRedisAdapter;
  let port: number;
  let baseUrl: string;

  beforeEach(async () => {
    // Create a new express app and server for each test
    const app = express();
    server = new Server(app);
    
    // Create a mock Redis adapter
    redisAdapter = new MockRedisAdapter();
    
    // Spy on Redis adapter methods
    vi.spyOn(redisAdapter, 'publish');
    vi.spyOn(redisAdapter, 'subscribe');
    vi.spyOn(redisAdapter, 'unsubscribe');
    
    // Initialize SignalGateway with the server and Redis adapter
    signalGateway = new SignalGateway(server, redisAdapter);
    
    // Start the server on a random port
    await new Promise<void>(resolve => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        port = address.port;
        baseUrl = `ws://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>(resolve => {
      server.close(() => resolve());
    });
  });

  it('should establish WebSocket connection to a room', async () => {
    return new Promise<void>((resolve, reject) => {
      const roomId = 'test-room';
      const ws = new WebSocket(`${baseUrl}/signal/${roomId}`);
      
      ws.on('open', () => {
        expect(redisAdapter.subscribe).toHaveBeenCalledWith(`room:${roomId}`, expect.any(Function));
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        reject(error);
      });
    });
  });

  it('should publish messages to Redis when received from client', async () => {
    return new Promise<void>((resolve, reject) => {
      const roomId = 'test-room';
      const ws = new WebSocket(`${baseUrl}/signal/${roomId}`);
      const testMessage = {
        type: 'sdp',
        senderId: 'user1',
        targetId: 'user2',
        sdp: {
          type: 'offer',
          sdp: 'test-sdp-data'
        }
      };
      
      ws.on('open', () => {
        ws.send(JSON.stringify(testMessage));
      });
      
      ws.on('error', reject);
      
      // Wait a bit to ensure the message is processed
      setTimeout(() => {
        try {
          expect(redisAdapter.publish).toHaveBeenCalledWith(
            `room:${roomId}`, 
            JSON.stringify(testMessage)
          );
          ws.close();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  });

  it('should broadcast messages to all clients in the same room', async () => {
    return new Promise<void>((resolve, reject) => {
      const roomId = 'test-room';
      const ws1 = new WebSocket(`${baseUrl}/signal/${roomId}`);
      
      ws1.on('open', () => {
        // Connect second client after first one is connected
        const ws2 = new WebSocket(`${baseUrl}/signal/${roomId}`);
        
        ws2.on('open', () => {
          // Send a message from the first client
          const testMessage = {
            type: 'sdp',
            senderId: 'user1',
            targetId: 'user2',
            sdp: {
              type: 'offer',
              sdp: 'test-sdp-data'
            }
          };
          
          // Set up listener for second client
          ws2.on('message', (data) => {
            try {
              const message = JSON.parse(data.toString());
              expect(message).toEqual(testMessage);
              ws1.close();
              ws2.close();
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          
          // Manually trigger the Redis message broadcast to simulate pub/sub
          const redisChannel = `room:${roomId}`;
          const messageString = JSON.stringify(testMessage);
          
          // Small delay to ensure both connections are fully set up
          setTimeout(() => {
            // Simulate a Redis message coming in
            redisAdapter.publish(redisChannel, messageString)
              .catch(reject);
          }, 50);
        });
        
        ws2.on('error', reject);
      });
      
      ws1.on('error', reject);
    });
  });

  it('should unsubscribe from Redis when all clients leave a room', async () => {
    return new Promise<void>((resolve, reject) => {
      const roomId = 'test-room';
      const ws = new WebSocket(`${baseUrl}/signal/${roomId}`);
      
      ws.on('open', () => {
        // Close the connection to trigger cleanup
        ws.close();
        
        // Wait a bit to ensure cleanup happens
        setTimeout(() => {
          try {
            expect(redisAdapter.unsubscribe).toHaveBeenCalledWith(`room:${roomId}`);
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 100);
      });
      
      ws.on('error', reject);
    });
  });
});
