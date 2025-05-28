import { z } from 'zod';

// User schema
export const UserSchema = z.object({
  uid: z.string(),
  handle: z.string(),
  created: z.number().optional().default(() => Date.now()),
});
export type User = z.infer<typeof UserSchema>;

// Room status enum
export const RoomStatusEnum = z.enum(['waiting', 'playing', 'finished']);
export type RoomStatus = z.infer<typeof RoomStatusEnum>;

// Room schema
export const RoomSchema = z.object({
  hostUid: z.string(),
  players: z.array(z.string()),
  status: RoomStatusEnum,
  created: z.number().optional().default(() => Date.now()),
});
export type Room = z.infer<typeof RoomSchema>;

// Hash schema
export const HashSchema = z.object({
  roomId: z.string(),
  tick: z.number(),
  hash: z.string(),
  timestamp: z.number().optional().default(() => Date.now()),
});
export type Hash = z.infer<typeof HashSchema>;

// Create room request schema
export const CreateRoomRequestSchema = z.object({
  hostUid: z.string(),
  initialPlayers: z.array(z.string()).optional().default([]),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

// Get rooms response schema
export const GetRoomsResponseSchema = z.array(
  z.object({
    id: z.string(),
    hostUid: z.string(),
    players: z.array(z.string()),
    status: RoomStatusEnum,
    created: z.number(),
  })
);
export type GetRoomsResponse = z.infer<typeof GetRoomsResponseSchema>;

// Create hash request schema
export const CreateHashRequestSchema = z.object({
  roomId: z.string(),
  tick: z.number(),
  hash: z.string(),
});
export type CreateHashRequest = z.infer<typeof CreateHashRequestSchema>;
