import { z } from 'zod';

// Room status enum
export const RoomStatusEnum = z.enum(['waiting', 'playing', 'finished']);
export type RoomStatus = z.infer<typeof RoomStatusEnum>;

// Room creation request schema
export const CreateRoomSchema = z.object({
  hostUid: z.string(),
});
export type CreateRoomRequest = z.infer<typeof CreateRoomSchema>;

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
