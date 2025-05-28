import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a user by ID
 */
export const getById = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .first();
    return user;
  },
});

/**
 * Create a new user
 */
export const create = mutation({
  args: { 
    uid: v.string(),
    username: v.string(),
    email: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .first();
    
    if (existingUser) {
      throw new Error(`User with ID ${args.uid} already exists`);
    }
    
    const id = await ctx.db.insert("users", {
      uid: args.uid,
      username: args.username,
      email: args.email,
      created: Date.now(),
      lastSeen: Date.now()
    });
    
    return args.uid;
  },
});

/**
 * Update a user
 */
export const update = mutation({
  args: {
    uid: v.string(),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    lastSeen: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { uid, ...updateFields } = args;
    
    // Find the user by uid
    const user = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", uid))
      .first();
    
    if (!user) {
      throw new Error(`User with ID ${uid} not found`);
    }
    
    // Update the user
    await ctx.db.patch(user._id, updateFields);
    
    return uid;
  },
});

/**
 * Update user's last seen timestamp
 */
export const updateLastSeen = mutation({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .first();
    
    if (!user) {
      throw new Error(`User with ID ${args.uid} not found`);
    }
    
    await ctx.db.patch(user._id, {
      lastSeen: Date.now()
    });
    
    return args.uid;
  },
});

/**
 * Delete a user
 */
export const remove = mutation({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .first();
    
    if (!user) {
      throw new Error(`User with ID ${args.uid} not found`);
    }
    
    await ctx.db.delete(user._id);
    return args.uid;
  },
});
