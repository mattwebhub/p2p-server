import { Room, RoomList, CreateRoomRequest } from './schema';

// Mock database for rooms (in-memory storage for now)
// In a real implementation, this would be replaced with Convex calls
let roomsDb: Record<string, Room> = {};

export class RoomService {
  /**
   * Create a new room
   */
  createRoom(request: CreateRoomRequest): Room {
    const roomId = this.generateRoomId();
    
    const room: Room = {
      roomId,
      hostUid: request.hostUid,
      players: [request.hostUid],
      status: 'waiting',
      created: Date.now()
    };
    
    roomsDb[roomId] = room;
    return room;
  }
  
  /**
   * Get all rooms
   */
  getAllRooms(options?: { limit?: number; offset?: number; status?: string }): RoomList {
    let rooms = Object.values(roomsDb);

    if (options?.status) {
      rooms = rooms.filter(room => room.status === options.status);
    }

    if (options?.offset) {
      rooms = rooms.slice(options.offset);
    }

    if (options?.limit) {
      rooms = rooms.slice(0, options.limit);
    }

    return rooms;
  }
  
  /**
   * Get a room by ID
   */
  getRoomById(roomId: string): Room | null {
    return roomsDb[roomId] || null;
  }
  
  /**
   * Clear all rooms (for testing purposes)
   */
  clearAllRooms(): void {
    roomsDb = {};
  }
  
  /**
   * Generate a unique room ID
   */
  private generateRoomId(): string {
    // Simple implementation for now - in production would use a more robust method
    return Math.random().toString(36).substring(2, 10);
  }
}

// Export singleton instance
export const roomService = new RoomService();
