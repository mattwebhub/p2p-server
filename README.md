# P2P Backend API Documentation

## Overview

This document provides an overview of the P2P Backend API, which serves as the backend for a peer-to-peer web server. The backend handles room creation, room listing, WebRTC signaling, and TURN credential issuance.

## Current Implementation Status

### Completed Components

- Express server with health check endpoint
- Room API endpoints (POST /rooms, GET /rooms, GET /rooms/:roomId)
- In-memory room storage (to be replaced with Convex in production)
- Test suite for all implemented endpoints

### Pending Components

- WebSocket server for signaling
- Redis pub/sub adapter
- Convex connection
- TURN credential issuance

## API Endpoints

### Health Check

- **GET /healthz**
  - Returns a 200 OK response with a status message
  - Response: `{ "status": "ok" }`

### Rooms

- **POST /rooms**
  - Creates a new room
  - Request Body: `{ "hostUid": "string" }`
  - Response: Room object with status "waiting"
  
- **GET /rooms**
  - Returns a list of all rooms
  - Response: Array of Room objects
  
- **GET /rooms/:roomId**
  - Returns a specific room by ID
  - Response: Room object or 404 if not found

## Data Models

### Room

```typescript
{
  roomId: string;
  hostUid: string;
  players: string[];
  status: "waiting" | "playing" | "finished";
  created: number; // timestamp
}
```

## Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Next Steps

1. Implement WebSocket server for signaling
2. Set up Redis pub/sub adapter
3. Configure Convex connection
4. Implement TURN credential issuance

## Test Change

This change was made using the GitHub API workflow demonstration.
