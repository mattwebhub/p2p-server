import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RedisAdapterImpl } from '../src/signal/redisAdapterImpl';

// Create mock functions
const mockPublish = vi.fn().mockResolvedValue(undefined);
const mockSubscribe = vi.fn().mockResolvedValue(undefined);
const mockUnsubscribe = vi.fn().mockResolvedValue(undefined);
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn();

// Mock redis client
vi.mock('redis', () => {
  return {
    createClient: vi.fn(() => ({
      connect: mockConnect,
      disconnect: mockDisconnect,
      publish: mockPublish,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      on: mockOn
    }))
  };
});

describe('RedisAdapterImpl', () => {
  let redisAdapter: RedisAdapterImpl;
  
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Create a new adapter instance
    redisAdapter = new RedisAdapterImpl('redis://localhost:6379');
  });
  
  afterEach(async () => {
    // Disconnect the adapter
    await redisAdapter.disconnect();
  });
  
  describe('Connection Management', () => {
    it('should connect to Redis on first operation', async () => {
      // Act
      await redisAdapter.publish('test-channel', 'test-message');
      
      // Assert
      expect(mockConnect).toHaveBeenCalled();
    });
    
    it('should not reconnect if already connected', async () => {
      // Arrange
      await redisAdapter.connect();
      vi.clearAllMocks(); // Clear the first connect call
      
      // Act
      await redisAdapter.publish('test-channel', 'test-message');
      
      // Assert
      expect(mockConnect).not.toHaveBeenCalled();
    });
    
    it('should disconnect from Redis', async () => {
      // Arrange
      await redisAdapter.connect();
      
      // Act
      await redisAdapter.disconnect();
      
      // Assert
      expect(mockDisconnect).toHaveBeenCalled();
    });
    
    it('should set up error handlers', () => {
      // Assert
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });
  
  describe('Channel Management', () => {
    it('should publish messages to a channel', async () => {
      // Arrange
      const channel = 'test-channel';
      const message = 'test-message';
      
      // Act
      await redisAdapter.publish(channel, message);
      
      // Assert
      expect(mockPublish).toHaveBeenCalledWith(channel, message);
    });
    
    it('should subscribe to a channel', async () => {
      // Arrange
      const channel = 'test-channel';
      const callback = vi.fn();
      
      // Act
      await redisAdapter.subscribe(channel, callback);
      
      // Assert
      expect(mockSubscribe).toHaveBeenCalledWith(channel, expect.any(Function));
    });
    
    it('should unsubscribe from a channel', async () => {
      // Arrange
      const channel = 'test-channel';
      await redisAdapter.subscribe(channel, vi.fn());
      
      // Act
      await redisAdapter.unsubscribe(channel);
      
      // Assert
      expect(mockUnsubscribe).toHaveBeenCalledWith(channel);
    });
    
    it('should track active channels', async () => {
      // Arrange
      const channel1 = 'test-channel-1';
      const channel2 = 'test-channel-2';
      
      // Act
      await redisAdapter.subscribe(channel1, vi.fn());
      await redisAdapter.subscribe(channel2, vi.fn());
      
      // Assert
      expect(redisAdapter.getActiveChannels()).toContain(channel1);
      expect(redisAdapter.getActiveChannels()).toContain(channel2);
      expect(redisAdapter.getActiveChannels().length).toBe(2);
    });
    
    it('should track multiple callbacks per channel', async () => {
      // Arrange
      const channel = 'test-channel';
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      // Act
      await redisAdapter.subscribe(channel, callback1);
      await redisAdapter.subscribe(channel, callback2);
      
      // Assert
      expect(redisAdapter.getSubscriptionCount(channel)).toBe(2);
    });
    
    it('should remove specific callback when unsubscribing with callback', async () => {
      // Arrange
      const channel = 'test-channel';
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      await redisAdapter.subscribe(channel, callback1);
      await redisAdapter.subscribe(channel, callback2);
      
      // Act
      await redisAdapter.unsubscribe(channel, callback1);
      
      // Assert
      expect(redisAdapter.getSubscriptionCount(channel)).toBe(1);
      expect(mockUnsubscribe).not.toHaveBeenCalled(); // Should not unsubscribe from Redis yet
    });
    
    it('should unsubscribe from Redis when last callback is removed', async () => {
      // Arrange
      const channel = 'test-channel';
      const callback = vi.fn();
      await redisAdapter.subscribe(channel, callback);
      
      // Act
      await redisAdapter.unsubscribe(channel, callback);
      
      // Assert
      expect(redisAdapter.getSubscriptionCount(channel)).toBe(0);
      expect(mockUnsubscribe).toHaveBeenCalledWith(channel);
    });
  });
  
  describe('Reconnection Logic', () => {
    it('should set up event handlers for reconnection', () => {
      // Verify that event handlers are set up
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('ready', expect.any(Function));
    });
  });
});
