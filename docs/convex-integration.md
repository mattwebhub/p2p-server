# Convex Integration for P2P Game Backend

This document provides an overview of the Convex integration for data persistence in the P2P Game Backend.

## Components Implemented

1. **Convex Client**
   - Singleton client for connecting to Convex backend
   - Environment-based configuration
   - Error handling and connection management

2. **Data Models**
   - User management (uid, handle, created)
   - Room management (hostUid, players, status, created)
   - Hash storage (roomId, tick, hash, timestamp)

3. **Service Layer**
   - UserService for user CRUD operations
   - RoomService for room management and player operations
   - HashService for game state hash storage and retrieval

## Schema

The implementation follows the schema specified in the technical design document:

```typescript
// Users table
{
  uid: string,
  handle: string,
  created: number
}

// Rooms table
{
  hostUid: string,
  players: string[],
  status: 'waiting' | 'playing' | 'finished',
  created: number
}

// Hashes table
{
  roomId: string,
  tick: number,
  hash: string,
  timestamp: number
}
```

## Usage

### User Management

```typescript
import { UserService } from './convex/userService';

const userService = new UserService();

// Create a user
const userId = await userService.createUser({
  uid: 'user123',
  handle: 'player1'
});

// Get a user
const user = await userService.getUserById('user123');

// Update a user
await userService.updateUser('user123', { handle: 'newUsername' });

// Delete a user
await userService.deleteUser('user123');
```

### Room Management

```typescript
import { RoomService } from './convex/roomService';

const roomService = new RoomService();

// Create a room
const roomId = await roomService.createRoom({
  hostUid: 'user123',
  initialPlayers: ['user456']
});

// Get all rooms
const rooms = await roomService.getAllRooms();

// Update room status
await roomService.updateRoomStatus(roomId, 'playing');

// Add player to room
await roomService.addPlayerToRoom(roomId, 'user789');

// Remove player from room
await roomService.removePlayerFromRoom(roomId, 'user456');
```

### Hash Storage

```typescript
import { HashService } from './convex/hashService';

const hashService = new HashService();

// Store a hash
await hashService.storeHash({
  roomId: 'room123',
  tick: 42,
  hash: 'abcdef1234567890'
});

// Get hashes for a room
const hashes = await hashService.getHashesByRoom('room123');

// Get specific hash
const hash = await hashService.getHashByRoomAndTick('room123', 42);
```

## Configuration

The Convex integration requires the following environment variables:

- `CONVEX_URL`: URL of your Convex deployment
- `CONVEX_DEPLOY_KEY`: Deployment key for Convex
- `CONVEX_ADMIN_TOKEN`: Admin token for Convex operations

These can be configured in the `config.ts` file or provided as environment variables.

## Testing

The implementation includes comprehensive tests for all services:
- Unit tests for UserService
- Unit tests for RoomService
- Unit tests for HashService

All tests use mocked Convex client to avoid actual API calls during testing.

## Next Steps

1. **API Integration**: Connect the Convex services to the REST API endpoints
2. **WebSocket Integration**: Use Convex for persisting WebSocket session data
3. **TURN Credential Issuance**: Implement the endpoint for temporary TURN credentials
