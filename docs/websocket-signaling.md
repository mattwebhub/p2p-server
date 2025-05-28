# WebSocket Signaling and Redis Pub/Sub Implementation

This document provides an overview of the WebSocket signaling server and Redis pub/sub adapter implementation for the P2P Game Backend.

## Components Implemented

1. **WebSocket Signaling Server**
   - Handles WebSocket connections for WebRTC signaling
   - Manages room-based connections
   - Validates message formats using Zod schemas
   - Broadcasts messages to appropriate clients

2. **Redis Pub/Sub Adapter**
   - Provides fan-out of signaling packets across pods
   - Includes a mock adapter for testing and local development
   - Implements connection management and error handling

## Architecture

The implementation follows the architecture specified in the technical design document:

```
Client WebSocket Connection
       ↓
SignalGateway (WebSocket Server)
       ↓
Redis Pub/Sub Adapter
       ↓
Redis Channel (room:{roomId})
       ↓
Other SignalGateway Instances
       ↓
Connected Clients
```

## Message Types

The following message types are supported:

- `sdp`: Session Description Protocol messages (offers/answers)
- `ice`: ICE candidate messages
- `host-change`: Host migration messages
- `kick`: Client removal messages

## Usage

### Server Initialization

```typescript
import { createServer } from 'http';
import { SignalGateway } from './signal/redisAdapter';
import { RedisAdapterImpl } from './signal/redisAdapterImpl';

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket signaling with Redis adapter
const redisAdapter = new RedisAdapterImpl('redis://localhost:6379');
const signalGateway = new SignalGateway(server, redisAdapter);

// Start server
server.listen(3000);
```

### Client Connection

Clients connect to the WebSocket server using the `/signal/{roomId}` endpoint:

```javascript
// Client-side code
const ws = new WebSocket('ws://api.game.example.com/signal/room123');

// Send SDP offer
ws.send(JSON.stringify({
  type: 'sdp',
  senderId: 'user1',
  targetId: 'user2',
  sdp: {
    type: 'offer',
    sdp: 'sdp-content-here'
  }
}));

// Listen for messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message based on type
};
```

## Testing

The implementation includes comprehensive tests for:

- WebSocket connection establishment
- Message publishing to Redis
- Message broadcasting to clients
- Room cleanup and Redis unsubscription

## Next Steps

1. **Convex Integration**: Implement data persistence for users, rooms, and hashes
2. **TURN Credential Issuance**: Implement the endpoint for temporary TURN credentials
