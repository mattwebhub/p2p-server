import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all rooms
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rooms").collect();
  },
});

/**
 * Get a room by ID
 */
export const getById = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();
    return room;
  },
});

/**
 * Create a new room
 */
export const create = mutation({
  args: {
    hostUid: v.string(),
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("rooms", {
      roomId: args.roomId,
      hostUid: args.hostUid,
      players: [args.hostUid],
      status: "waiting",
      created: Date.now(),
    });
    return args.roomId;
  },
});

/**
 * Update a room
 */
export const update = mutation({
  args: {
    roomId: v.string(),
    hostUid: v.optional(v.string()),
    players: v.optional(v.array(v.string())),
    status: v.optional(
      v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished"))
    ),
  },
  handler: async (ctx, args) => {
    const { roomId, ...updateFields } = args;

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .first();

    if (!room) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    await ctx.db.patch(room._id, updateFields);

    return roomId;
  },
});

/**
 * Add a player to a room
 */
export const addPlayer = mutation({
  args: {
    roomId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const { roomId, playerId } = args;

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .first();

    if (!room) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    if (room.players.includes(playerId)) {
      return roomId;
    }

    await ctx.db.patch(room._id, {
      players: [...room.players, playerId],
    });

    return roomId;
  },
});

/**
 * Remove a player from a room
 */
export const removePlayer = mutation({
  args: {
    roomId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const { roomId, playerId } = args;

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .first();

    if (!room) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    await ctx.db.patch(room._id, {
      players: room.players.filter((id) => id !== playerId),
    });

    return roomId;
  },
});

/**
 * Delete a room
 */
export const remove = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) {
      throw new Error(`Room with ID ${args.roomId} not found`);
    }

    await ctx.db.delete(room._id);
    return args.roomId;
  },
});
