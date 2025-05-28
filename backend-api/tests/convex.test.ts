import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../src/convex/userService';
import { RoomService } from '../src/convex/roomService';
import { HashService } from '../src/convex/hashService';
import { getConvexClient, resetConvexClient } from '../src/convex/client';
import { User, Room, Hash, RoomStatus } from '../src/convex/types';

// Mock the Convex client
vi.mock('../src/convex/client', () => {
  const mockClient = {
    query: vi.fn(),
    mutation: vi.fn()
  };
  
  return {
    getConvexClient: vi.fn(() => mockClient),
    resetConvexClient: vi.fn()
  };
});

describe('Convex Integration', () => {
  let userService: UserService;
  let roomService: RoomService;
  let hashService: HashService;
  let mockClient: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get mock client
    mockClient = getConvexClient();
    
    // Initialize services
    userService = new UserService();
    roomService = new RoomService();
    hashService = new HashService();
  });
  
  afterEach(() => {
    resetConvexClient();
  });
  
  describe('UserService', () => {
    it('should create a user', async () => {
      // Arrange
      const user: User = {
        uid: 'user123',
        handle: 'testuser',
        created: Date.now()
      };
      mockClient.mutation.mockResolvedValueOnce('user123');
      
      // Act
      const result = await userService.createUser(user);
      
      // Assert
      expect(mockClient.mutation).toHaveBeenCalledWith('users:create', user);
      expect(result).toBe('user123');
    });
    
    it('should get a user by ID', async () => {
      // Arrange
      const user: User = {
        uid: 'user123',
        handle: 'testuser',
        created: Date.now()
      };
      mockClient.query.mockResolvedValueOnce(user);
      
      // Act
      const result = await userService.getUserById('user123');
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('users:getById', { uid: 'user123' });
      expect(result).toEqual(user);
    });
    
    it('should update a user', async () => {
      // Arrange
      const userData = {
        handle: 'updateduser'
      };
      mockClient.mutation.mockResolvedValueOnce('user123');
      
      // Act
      const result = await userService.updateUser('user123', userData);
      
      // Assert
      expect(mockClient.mutation).toHaveBeenCalledWith('users:update', {
        uid: 'user123',
        handle: 'updateduser'
      });
      expect(result).toBe('user123');
    });
    
    it('should delete a user', async () => {
      // Arrange
      mockClient.mutation.mockResolvedValueOnce(true);
      
      // Act
      const result = await userService.deleteUser('user123');
      
      // Assert
      expect(mockClient.mutation).toHaveBeenCalledWith('users:delete', { uid: 'user123' });
      expect(result).toBe(true);
    });
  });
  
  describe('RoomService', () => {
    it('should create a room', async () => {
      // Arrange
      const createRoomRequest = {
        hostUid: 'user123',
        initialPlayers: ['user456']
      };
      mockClient.mutation.mockResolvedValueOnce('room123');
      
      // Act
      const result = await roomService.createRoom(createRoomRequest);
      
      // Assert
      expect(mockClient.mutation).toHaveBeenCalledWith('rooms:create', expect.objectContaining({
        hostUid: 'user123',
        players: ['user123', 'user456'],
        status: 'waiting'
      }));
      expect(result).toBe('room123');
    });
    
    it('should get a room by ID', async () => {
      // Arrange
      const room: Room = {
        hostUid: 'user123',
        players: ['user123', 'user456'],
        status: 'waiting',
        created: Date.now()
      };
      mockClient.query.mockResolvedValueOnce(room);
      
      // Act
      const result = await roomService.getRoomById('room123');
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('rooms:getById', { roomId: 'room123' });
      expect(result).toEqual(room);
    });
    
    it('should get all rooms', async () => {
      // Arrange
      const rooms = [
        {
          id: 'room123',
          hostUid: 'user123',
          players: ['user123', 'user456'],
          status: 'waiting',
          created: Date.now()
        },
        {
          id: 'room456',
          hostUid: 'user789',
          players: ['user789'],
          status: 'waiting',
          created: Date.now()
        }
      ];
      mockClient.query.mockResolvedValueOnce(rooms);
      
      // Act
      const result = await roomService.getAllRooms();
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('rooms:getAll', {});
      expect(result).toEqual(rooms);
    });
    
    it('should update room status', async () => {
      // Arrange
      mockClient.mutation.mockResolvedValueOnce('room123');
      
      // Act
      const result = await roomService.updateRoomStatus('room123', 'playing');
      
      // Assert
      expect(mockClient.mutation).toHaveBeenCalledWith('rooms:update', {
        roomId: 'room123',
        status: 'playing'
      });
      expect(result).toBe('room123');
    });
    
    it('should add player to room', async () => {
      // Arrange
      const room: Room = {
        hostUid: 'user123',
        players: ['user123'],
        status: 'waiting',
        created: Date.now()
      };
      mockClient.query.mockResolvedValueOnce(room);
      mockClient.mutation.mockResolvedValueOnce('room123');
      
      // Act
      const result = await roomService.addPlayerToRoom('room123', 'user456');
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('rooms:getById', { roomId: 'room123' });
      expect(mockClient.mutation).toHaveBeenCalledWith('rooms:update', {
        roomId: 'room123',
        players: ['user123', 'user456']
      });
      expect(result).toBe('room123');
    });
  });
  
  describe('HashService', () => {
    it('should store a hash', async () => {
      // Arrange
      const hashData = {
        roomId: 'room123',
        tick: 42,
        hash: 'abcdef1234567890'
      };
      mockClient.mutation.mockResolvedValueOnce('hash123');
      
      // Act
      const result = await hashService.storeHash(hashData);
      
      // Assert
      expect(mockClient.mutation).toHaveBeenCalledWith('hashes:create', expect.objectContaining({
        roomId: 'room123',
        tick: 42,
        hash: 'abcdef1234567890'
      }));
      expect(result).toBe('hash123');
    });
    
    it('should get hashes by room', async () => {
      // Arrange
      const hashes: Hash[] = [
        {
          roomId: 'room123',
          tick: 42,
          hash: 'abcdef1234567890',
          timestamp: Date.now()
        },
        {
          roomId: 'room123',
          tick: 43,
          hash: '0987654321fedcba',
          timestamp: Date.now()
        }
      ];
      mockClient.query.mockResolvedValueOnce(hashes);
      
      // Act
      const result = await hashService.getHashesByRoom('room123');
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('hashes:getByRoom', { roomId: 'room123' });
      expect(result).toEqual(hashes);
    });
    
    it('should get hash by room and tick', async () => {
      // Arrange
      const hash: Hash = {
        roomId: 'room123',
        tick: 42,
        hash: 'abcdef1234567890',
        timestamp: Date.now()
      };
      mockClient.query.mockResolvedValueOnce(hash);
      
      // Act
      const result = await hashService.getHashByRoomAndTick('room123', 42);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith('hashes:getByRoomAndTick', { roomId: 'room123', tick: 42 });
      expect(result).toEqual(hash);
    });
    
    it('should delete hashes by room', async () => {
      // Arrange
      mockClient.mutation.mockResolvedValueOnce(true);
      
      // Act
      const result = await hashService.deleteHashesByRoom('room123');
      
      // Assert
      expect(mockClient.mutation).toHaveBeenCalledWith('hashes:deleteByRoom', { roomId: 'room123' });
      expect(result).toBe(true);
    });
  });
});
