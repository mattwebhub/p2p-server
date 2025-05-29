# Validation Documentation

## Overview

This document describes the validation approach used in the P2P Server codebase. We use [Zod](https://github.com/colinhacks/zod) for schema validation throughout the application to ensure data integrity and provide consistent error handling.

## Validation Middleware

The application uses a centralized validation middleware located at `src/shared/middleware/validation.ts`. This middleware can validate request bodies, query parameters, and URL parameters using Zod schemas.

### Usage

```typescript
import { validateRequest } from '../shared/middleware/validation';
import { MySchema } from './schema';

// Validate request body
router.post('/endpoint', 
  validateRequest(MySchema, 'body'),
  myController.handleRequest
);

// Validate query parameters
router.get('/endpoint', 
  validateRequest(QueryParamsSchema, 'query'),
  myController.handleRequest
);

// Validate URL parameters
router.get('/endpoint/:id', 
  validateRequest(ParamsSchema, 'params'),
  myController.handleRequest
);
```

## Error Handling

The application uses a centralized error handling middleware located at `src/shared/middleware/errorHandler.ts`. This middleware catches errors thrown by controllers and middleware, formats them consistently, and returns appropriate HTTP status codes.

### Error Response Format

```json
{
  "error": "Error type or message",
  "details": {
    "field.path": "Specific error message"
  }
}
```

## Validation Schemas

### Room Schemas

- `RoomIdSchema`: Validates room IDs as UUIDs
- `CreateRoomSchema`: Validates room creation requests
- `GetRoomsQuerySchema`: Validates query parameters for room listing
- `RoomSchema`: Validates room response objects

### TURN Credential Schemas

- `TurnCredentialsRequestSchema`: Validates TURN credential requests
- `TurnCredentialsResponseSchema`: Validates TURN credential responses

### WebSocket Connection Schemas

- `WebSocketConnectionParamsSchema`: Validates WebSocket connection parameters
- `SignalMessageSchema`: Validates WebSocket signal messages

## Best Practices

1. **Always use the validation middleware** for all endpoints that accept user input
2. **Define schemas in dedicated schema files** to promote reuse
3. **Use appropriate Zod validators** for each data type
4. **Include meaningful error messages** in schema definitions
5. **Validate both request and response data** where appropriate
6. **Use the centralized error handler** to ensure consistent error responses

## Examples

### Validating a Room ID

```typescript
// In schema.ts
export const RoomIdSchema = z.string().uuid();

// In controller
const parseResult = RoomIdSchema.safeParse(roomId);
if (!parseResult.success) {
  return res.status(400).json({ 
    error: 'Invalid room ID format', 
    details: parseResult.error 
  });
}
```

### Validating Query Parameters

```typescript
// In schema.ts
export const GetRoomsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  status: RoomStatusEnum.optional(),
});

// In routes.ts
router.get('/', 
  validateRequest(GetRoomsQuerySchema, 'query'),
  roomController.getAllRooms
);
```
