import { getConvexClient } from './client';

export interface Hash {
  roomId: string;
  tick: number;
  hash: string;
  timestamp: number;
}

export class HashService {
  constructor() {
    // No client parameter needed as we'll get it from the client module
  }

  async storeHash(hashData: { roomId: string; tick: number; hash: string }): Promise<string> {
    try {
      const client = getConvexClient();
      return await client.mutation('hashes:create', hashData);
    } catch (error) {
      console.error('Error storing hash:', error);
      throw error;
    }
  }

  async getHashesByRoom(roomId: string): Promise<Hash[]> {
    try {
      const client = getConvexClient();
      return await client.query('hashes:getByRoom', { roomId });
    } catch (error) {
      console.error('Error getting hashes by room:', error);
      return [];
    }
  }

  async getHashByRoomAndTick(roomId: string, tick: number): Promise<Hash | null> {
    try {
      const client = getConvexClient();
      return await client.query('hashes:getByRoomAndTick', { roomId, tick });
    } catch (error) {
      console.error('Error getting hash by room and tick:', error);
      return null;
    }
  }

  async deleteHashesByRoom(roomId: string): Promise<boolean> {
    try {
      const client = getConvexClient();
      return await client.mutation('hashes:deleteByRoom', { roomId });
    } catch (error) {
      console.error('Error deleting hashes by room:', error);
      return false;
    }
  }
}
