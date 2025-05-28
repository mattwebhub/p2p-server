import { getConvexClient } from './client';
import { Hash, HashSchema, CreateHashRequest } from './types';

/**
 * Hash service for interacting with Convex hashes table
 */
export class HashService {
  /**
   * Store a new game state hash
   * @param hashData Hash data to store
   * @returns Created hash ID
   */
  async storeHash(hashData: CreateHashRequest): Promise<string> {
    try {
      // Prepare hash data
      const hash: Hash = {
        roomId: hashData.roomId,
        tick: hashData.tick,
        hash: hashData.hash,
        timestamp: Date.now()
      };
      
      // Validate hash data
      const validatedHash = HashSchema.parse(hash);
      
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to store hash
      const hashId = await client.mutation('hashes:create', validatedHash);
      
      return hashId as string;
    } catch (error) {
      console.error('Failed to store hash:', error);
      throw new Error(`Failed to store hash: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get hashes for a specific room
   * @param roomId Room ID
   * @returns List of hashes for the room
   */
  async getHashesByRoom(roomId: string): Promise<Hash[]> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex query to get hashes by room
      const hashes = await client.query('hashes:getByRoom', { roomId });
      
      return hashes as Hash[];
    } catch (error) {
      console.error('Failed to get hashes:', error);
      throw new Error(`Failed to get hashes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a specific hash by room and tick
   * @param roomId Room ID
   * @param tick Game tick number
   * @returns Hash data or null if not found
   */
  async getHashByRoomAndTick(roomId: string, tick: number): Promise<Hash | null> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex query to get hash by room and tick
      const hash = await client.query('hashes:getByRoomAndTick', { roomId, tick });
      
      return hash as Hash | null;
    } catch (error) {
      console.error('Failed to get hash:', error);
      throw new Error(`Failed to get hash: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete hashes for a specific room
   * @param roomId Room ID
   * @returns Success status
   */
  async deleteHashesByRoom(roomId: string): Promise<boolean> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to delete hashes by room
      await client.mutation('hashes:deleteByRoom', { roomId });
      
      return true;
    } catch (error) {
      console.error('Failed to delete hashes:', error);
      throw new Error(`Failed to delete hashes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
