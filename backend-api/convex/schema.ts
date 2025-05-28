import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for the P2P server
 * 
 * Defines tables for:
 * - rooms: For managing game/meeting rooms
 * - users: For user profiles and authentication
 * - hashes: For game state synchronization
 */
export default defineSchema({
  // Room table for managing game/meeting rooms
  rooms: defineTable({
    roomId: v.string(),
    hostUid: v.string(),
    players: v.array(v.string()),
    status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
    created: v.number(),
  }).index("by_roomId", ["roomId"]),

  // User table for user profiles and authentication
  users: defineTable({
    uid: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    created: v.number(),
    lastSeen: v.optional(v.number()),
  }).index("by_uid", ["uid"]),

  // Hash table for game state synchronization
  hashes: defineTable({
    roomId: v.string(),
    tick: v.number(),
    hash: v.string(),
    timestamp: v.number(),
  }).index("by_roomId", ["roomId"])
    .index("by_roomId_tick", ["roomId", "tick"]),
});
