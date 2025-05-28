import { Request, Response } from 'express';
import { roomService } from './service';
import { CreateRoomSchema } from './schema';

export class RoomController {
  /**
   * Create a new room
   * POST /rooms
   */
  createRoom(req: Request, res: Response): void {
    try {
      // Validate request body
      const parseResult = CreateRoomSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({ error: 'Invalid request body', details: parseResult.error });
        return;
      }

      // Create room
      const room = roomService.createRoom(parseResult.data);
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all rooms
   * GET /rooms
   */
  getAllRooms(_req: Request, res: Response): void {
    try {
      const rooms = roomService.getAllRooms();
      res.status(200).json(rooms);
    } catch (error) {
      console.error('Error getting rooms:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get a room by ID
   * GET /rooms/:roomId
   */
  getRoomById(req: Request, res: Response): void {
    try {
      const { roomId } = req.params;
      const room = roomService.getRoomById(roomId);
      
      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      
      res.status(200).json(room);
    } catch (error) {
      console.error('Error getting room:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Export singleton instance
export const roomController = new RoomController();
