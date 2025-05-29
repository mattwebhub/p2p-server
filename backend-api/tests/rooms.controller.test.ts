import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { roomController } from '../src/rooms/controller';
import { roomService } from '../src/rooms/service';

// Mock the room service
vi.mock('../src/rooms/service', () => ({
  roomService: {
    createRoom: vi.fn(),
    getAllRooms: vi.fn(),
    getRoomById: vi.fn()
  }
}));

describe('Room Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {};
    responseObject = {
      statusCode: 0,
      body: null
    };
    mockResponse = {
      status: vi.fn().mockImplementation((code) => {
        responseObject.statusCode = code;
        return mockResponse;
      }),
      json: vi.fn().mockImplementation((data) => {
        responseObject.body = data;
        return mockResponse;
      })
    };
  });

  describe('createRoom', () => {
    it('should create a room with valid input', () => {
      // Setup
      const roomData = { hostUid: 'user123' };
      const createdRoom = { 
        roomId: 'room123', 
        hostUid: 'user123', 
        players: ['user123'], 
        status: 'waiting', 
        created: Date.now() 
      };
      
      mockRequest.body = roomData;
      vi.mocked(roomService.createRoom).mockReturnValue(createdRoom);

      // Execute
      roomController.createRoom(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(roomService.createRoom).toHaveBeenCalledWith(roomData);
      expect(responseObject.statusCode).toBe(201);
      expect(responseObject.body).toEqual(createdRoom);
    });

    it('should return 400 with invalid input', () => {
      // Setup - missing hostUid
      mockRequest.body = {};

      // Execute
      roomController.createRoom(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(roomService.createRoom).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toHaveProperty('error');
    });
  });

  describe('getAllRooms', () => {
    it('should return all rooms with valid query parameters', () => {
      // Setup
      const rooms = [
        { roomId: 'room1', hostUid: 'user1', players: ['user1'], status: 'waiting', created: Date.now() },
        { roomId: 'room2', hostUid: 'user2', players: ['user2'], status: 'playing', created: Date.now() }
      ];
      
      mockRequest.query = { limit: '10', offset: '0' };
      vi.mocked(roomService.getAllRooms).mockReturnValue(rooms);

      // Execute
      roomController.getAllRooms(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(roomService.getAllRooms).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual(rooms);
    });

    it('should return 400 with invalid query parameters', () => {
      // Setup - invalid limit (negative)
      mockRequest.query = { limit: '-5' };

      // Execute
      roomController.getAllRooms(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(roomService.getAllRooms).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toHaveProperty('error');
    });
  });

  describe('getRoomById', () => {
    it('should return a room when valid ID is provided', () => {
      // Setup
      const roomId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID
      const room = { 
        roomId, 
        hostUid: 'user1', 
        players: ['user1'], 
        status: 'waiting', 
        created: Date.now() 
      };
      
      mockRequest.params = { roomId };
      vi.mocked(roomService.getRoomById).mockReturnValue(room);

      // Execute
      roomController.getRoomById(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(roomService.getRoomById).toHaveBeenCalledWith(roomId);
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual(room);
    });

    it('should return 400 with invalid room ID format', () => {
      // Setup - invalid UUID format
      mockRequest.params = { roomId: 'invalid-uuid' };

      // Execute
      roomController.getRoomById(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(roomService.getRoomById).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toHaveProperty('error');
    });

    it('should return 404 when room is not found', () => {
      // Setup
      const roomId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID
      mockRequest.params = { roomId };
      vi.mocked(roomService.getRoomById).mockReturnValue(null);

      // Execute
      roomController.getRoomById(mockRequest as Request, mockResponse as Response);

      // Verify
      expect(roomService.getRoomById).toHaveBeenCalledWith(roomId);
      expect(responseObject.statusCode).toBe(404);
      expect(responseObject.body).toHaveProperty('error');
    });
  });
});
