import { getConvexClient } from './client';

export interface Room {
  hostUid: string;
  players: string[];
  status: 'waiting' | 'playing' | 'finished';
  created: number;
}

export interface CreateRoomRequest {
  hostUid: string;
  initialPlayers?: string[];
}

export class RoomService {
  constructor() {
    // No client parameter needed as we'll get it from the client module
  }

  async createRoom(request: CreateRoomRequest): Promise<string> {
    try {
      const client = getConvexClient();
      const { hostUid, initialPlayers = [] } = request;
      
      // Ensure host is included in players list
      const players = [hostUid];
      if (initialPlayers.length > 0) {
        initialPlayers.forEach(player => {
          if (!players.includes(player)) {
            players.push(player);
          }
        });
      }
      
      return await client.mutation('rooms:create', {
        hostUid,
        players,
        status: 'waiting',
        created: Date.now()
      });
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      const client = getConvexClient();
      return await client.query('rooms:getById', { roomId });
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }

  async getAllRooms(): Promise<Room[]> {
    try {
      const client = getConvexClient();
      return await client.query('rooms:getAll', {});
    } catch (error) {
      console.error('Error getting all rooms:', error);
      return [];
    }
  }

  async updateRoomStatus(roomId: string, status: 'waiting' | 'playing' | 'finished'): Promise<string> {
    try {
      const client = getConvexClient();
      return await client.mutation('rooms:update', { roomId, status });
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  }

  async addPlayerToRoom(roomId: string, playerId: string): Promise<string> {
    try {
      const client = getConvexClient();
      const room = await client.query('rooms:getById', { roomId });
      
      if (!room) {
        throw new Error(`Room with ID ${roomId} not found`);
      }
      
      if (room.players.includes(playerId)) {
        return roomId; // Player already in room
      }
      
      return await client.mutation('rooms:update', {
        roomId,
        players: [...room.players, playerId]
      });
    } catch (error) {
      console.error('Error adding player to room:', error);
      throw error;
    }
  }
}
