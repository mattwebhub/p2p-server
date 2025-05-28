import { getConvexClient } from './client';
import { Room, RoomSchema, RoomStatus, CreateRoomRequest, GetRoomsResponse } from './types';

/**
 * Room service for interacting with Convex rooms table
 */
export class RoomService {
  /**
   * Create a new room
   * @param roomData Room creation request data
   * @returns Created room ID
   */
  async createRoom(roomData: CreateRoomRequest): Promise<string> {
    try {
      // Prepare room data
      const room: Room = {
        hostUid: roomData.hostUid,
        players: [roomData.hostUid, ...roomData.initialPlayers.filter(id => id !== roomData.hostUid)],
        status: 'waiting' as RoomStatus,
        created: Date.now()
      };
      
      // Validate room data
      const validatedRoom = RoomSchema.parse(room);
      
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to create room
      const roomId = await client.mutation('rooms:create', validatedRoom);
      
      return roomId as string;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw new Error(`Failed to create room: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a room by ID
   * @param roomId Room ID
   * @returns Room data or null if not found
   */
  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex query to get room
      const room = await client.query('rooms:getById', { roomId });
      
      return room as Room | null;
    } catch (error) {
      console.error('Failed to get room:', error);
      throw new Error(`Failed to get room: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get all rooms
   * @returns List of rooms
   */
  async getAllRooms(): Promise<GetRoomsResponse> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex query to get all rooms
      const rooms = await client.query('rooms:getAll', {});
      
      return rooms as GetRoomsResponse;
    } catch (error) {
      console.error('Failed to get rooms:', error);
      throw new Error(`Failed to get rooms: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update a room
   * @param roomId Room ID
   * @param roomData Room data to update
   * @returns Updated room ID
   */
  async updateRoom(roomId: string, roomData: Partial<Room>): Promise<string> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to update room
      const updatedRoomId = await client.mutation('rooms:update', {
        roomId,
        ...roomData
      });
      
      return updatedRoomId as string;
    } catch (error) {
      console.error('Failed to update room:', error);
      throw new Error(`Failed to update room: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update room status
   * @param roomId Room ID
   * @param status New room status
   * @returns Updated room ID
   */
  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<string> {
    return this.updateRoom(roomId, { status });
  }
  
  /**
   * Add player to room
   * @param roomId Room ID
   * @param playerId Player ID to add
   * @returns Updated room ID
   */
  async addPlayerToRoom(roomId: string, playerId: string): Promise<string> {
    try {
      // Get current room
      const room = await this.getRoomById(roomId);
      if (!room) {
        throw new Error(`Room not found: ${roomId}`);
      }
      
      // Check if player is already in the room
      if (room.players.includes(playerId)) {
        return roomId; // Player already in room, no update needed
      }
      
      // Add player to room
      const updatedPlayers = [...room.players, playerId];
      
      // Update room
      return this.updateRoom(roomId, { players: updatedPlayers });
    } catch (error) {
      console.error('Failed to add player to room:', error);
      throw new Error(`Failed to add player to room: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Remove player from room
   * @param roomId Room ID
   * @param playerId Player ID to remove
   * @returns Updated room ID
   */
  async removePlayerFromRoom(roomId: string, playerId: string): Promise<string> {
    try {
      // Get current room
      const room = await this.getRoomById(roomId);
      if (!room) {
        throw new Error(`Room not found: ${roomId}`);
      }
      
      // Remove player from room
      const updatedPlayers = room.players.filter(id => id !== playerId);
      
      // Update room
      return this.updateRoom(roomId, { players: updatedPlayers });
    } catch (error) {
      console.error('Failed to remove player from room:', error);
      throw new Error(`Failed to remove player from room: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a room
   * @param roomId Room ID
   * @returns Success status
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to delete room
      await client.mutation('rooms:delete', { roomId });
      
      return true;
    } catch (error) {
      console.error('Failed to delete room:', error);
      throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
