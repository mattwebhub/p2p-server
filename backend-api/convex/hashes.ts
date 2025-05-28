import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get hashes by room ID
 */
export const getByRoom = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const hashes = await ctx.db
      .query("hashes")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
    return hashes;
  },
});

/**
 * Get hash by room ID and tick
 */
export const getByRoomAndTick = query({
  args: { 
    roomId: v.string(),
    tick: v.number()
  },
  handler: async (ctx, args) => {
    const hash = await ctx.db
      .query("hashes")
      .withIndex("by_roomId_tick", (q) => 
        q.eq("roomId", args.roomId).eq("tick", args.tick)
      )
      .first();
    return hash;
  },
});

/**
 * Create a new hash
 */
export const create = mutation({
  args: { 
    roomId: v.string(),
    tick: v.number(),
    hash: v.string()
  },
  handler: async (ctx, args) => {
    // Check if hash already exists for this room and tick
    const existingHash = await ctx.db
      .query("hashes")
      .withIndex("by_roomId_tick", (q) => 
        q.eq("roomId", args.roomId).eq("tick", args.tick)
      )
      .first();
    
    if (existingHash) {
      throw new Error(`Hash already exists for room ${args.roomId} at tick ${args.tick}`);
    }
    
    const id = await ctx.db.insert("hashes", {
      roomId: args.roomId,
      tick: args.tick,
      hash: args.hash,
      timestamp: Date.now()
    });
    
    return id;
  },
});

/**
 * Delete hashes by room ID
 */
export const deleteByRoom = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const hashes = await ctx.db
      .query("hashes")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    // Delete all hashes for this room
    for (const hash of hashes) {
      await ctx.db.delete(hash._id);
    }
    
    return hashes.length;
  },
});
