import { z } from 'zod';

// Room status enum
export const RoomStatusEnum = z.enum(['waiting', 'playing', 'finished']);
export type RoomStatus = z.infer<typeof RoomStatusEnum>;

// Room ID schema
export const RoomIdSchema = z.string().uuid();
export type RoomId = z.infer<typeof RoomIdSchema>;

// Room creation request schema
export const CreateRoomSchema = z.object({
  hostUid: z.string(),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomSchema>;

// Get rooms query parameters schema
export const GetRoomsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
  status: RoomStatusEnum.optional(),
});
export type GetRoomsQuery = z.infer<typeof GetRoomsQuerySchema>;

// Room response schema
export const RoomSchema = z.object({
  roomId: z.string(),
  hostUid: z.string(),
  players: z.array(z.string()),
  status: RoomStatusEnum,
  created: z.number(),
});
export type Room = z.infer<typeof RoomSchema>;

// Room list response schema
export const RoomListSchema = z.array(RoomSchema);
export type RoomList = z.infer<typeof RoomListSchema>;
