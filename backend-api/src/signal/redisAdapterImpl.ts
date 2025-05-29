import { createClient, RedisClientType } from 'redis';
import { RedisAdapter } from './redisAdapter';

/**
 * Enhanced Redis Adapter Implementation with improved channel management and error handling
 */
export class RedisAdapterImpl implements RedisAdapter {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private isConnected = false;
  private reconnecting = false;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms
  private activeChannels = new Map<string, Set<(message: string) => void>>();
  private connectionPromise: Promise<void> | null = null;

  /**
   * Creates a new Redis adapter instance
   * @param redisUrl Redis connection URL
   */
  constructor(redisUrl: string) {
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });
    
    this.setupErrorHandlers();
  }

  /**
   * Set up error handlers for Redis clients
   */
  private setupErrorHandlers(): void {
    this.publisher.on('error', (err) => {
      console.error('Redis Publisher Error:', err);
      this.handleConnectionError('publisher');
    });
    
    this.subscriber.on('error', (err) => {
      console.error('Redis Subscriber Error:', err);
      this.handleConnectionError('subscriber');
    });

    // Handle reconnection events
    this.publisher.on('reconnecting', () => {
      console.log('Redis publisher reconnecting...');
    });

    this.subscriber.on('reconnecting', () => {
      console.log('Redis subscriber reconnecting...');
    });

    // Handle connection ready events
    this.publisher.on('ready', () => {
      console.log('Redis publisher ready');
    });

    this.subscriber.on('ready', () => {
      console.log('Redis subscriber ready');
      // Resubscribe to all active channels after reconnection
      this.resubscribeToChannels();
    });
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private async handleConnectionError(clientType: 'publisher' | 'subscriber'): Promise<void> {
    if (this.reconnecting) return;
    
    this.reconnecting = true;
    this.isConnected = false;
    
    let attempts = 0;
    while (attempts < this.maxReconnectAttempts) {
      try {
        console.log(`Attempting to reconnect Redis ${clientType} (attempt ${attempts + 1}/${this.maxReconnectAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * Math.pow(2, attempts)));
        
        await this.connect();
        this.reconnecting = false;
        console.log(`Redis ${clientType} reconnected successfully`);
        return;
      } catch (error) {
        console.error(`Failed to reconnect Redis ${clientType}:`, error);
        attempts++;
      }
    }
    
    this.reconnecting = false;
    console.error(`Failed to reconnect Redis ${clientType} after ${this.maxReconnectAttempts} attempts`);
  }

  /**
   * Resubscribe to all active channels after reconnection
   */
  private async resubscribeToChannels(): Promise<void> {
    if (this.activeChannels.size === 0) return;
    
    try {
      for (const [channel, callbacks] of this.activeChannels.entries()) {
        // Create a merged callback that calls all registered callbacks for this channel
        const mergedCallback = (message: string) => {
          callbacks.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error(`Error in Redis message callback for channel ${channel}:`, error);
            }
          });
        };
        
        // Resubscribe to the channel
        await this.subscriber.subscribe(channel, mergedCallback);
        console.log(`Resubscribed to channel: ${channel}`);
      }
    } catch (error) {
      console.error('Error resubscribing to channels:', error);
    }
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    // Use a connection promise to prevent multiple simultaneous connection attempts
    if (!this.connectionPromise) {
      this.connectionPromise = this.doConnect();
    }
    
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  /**
   * Internal connection method
   */
  private async doConnect(): Promise<void> {
    try {
      await this.publisher.connect();
      await this.subscriber.connect();
      this.isConnected = true;
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      // Unsubscribe from all channels first
      for (const channel of this.activeChannels.keys()) {
        await this.subscriber.unsubscribe(channel);
      }
      
      this.activeChannels.clear();
      
      await this.publisher.disconnect();
      await this.subscriber.disconnect();
      this.isConnected = false;
      console.log('Disconnected from Redis');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      await this.publisher.publish(channel, message);
    } catch (error) {
      console.error(`Error publishing to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      // Track the callback for this channel
      if (!this.activeChannels.has(channel)) {
        this.activeChannels.set(channel, new Set());
        
        // Create a merged callback that calls all registered callbacks for this channel
        const mergedCallback = (message: string) => {
          const callbacks = this.activeChannels.get(channel);
          if (callbacks) {
            callbacks.forEach(cb => {
              try {
                cb(message);
              } catch (error) {
                console.error(`Error in Redis message callback for channel ${channel}:`, error);
              }
            });
          }
        };
        
        // Subscribe to the channel with the merged callback
        await this.subscriber.subscribe(channel, mergedCallback);
      }
      
      // Add this callback to the set of callbacks for this channel
      this.activeChannels.get(channel)?.add(callback);
      
    } catch (error) {
      console.error(`Error subscribing to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   * If a callback is provided, only that callback is removed.
   * If no callback is provided, all callbacks are removed and the channel is unsubscribed.
   */
  async unsubscribe(channel: string, callback?: (message: string) => void): Promise<void> {
    try {
      if (!this.isConnected || !this.activeChannels.has(channel)) {
        return;
      }
      
      const callbacks = this.activeChannels.get(channel);
      
      if (callback && callbacks) {
        // Remove just this callback
        callbacks.delete(callback);
        
        // If there are no more callbacks, unsubscribe from the channel
        if (callbacks.size === 0) {
          await this.subscriber.unsubscribe(channel);
          this.activeChannels.delete(channel);
        }
      } else {
        // Remove all callbacks and unsubscribe from the channel
        await this.subscriber.unsubscribe(channel);
        this.activeChannels.delete(channel);
      }
    } catch (error) {
      console.error(`Error unsubscribing from channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Get the number of active subscriptions for a channel
   */
  getSubscriptionCount(channel: string): number {
    return this.activeChannels.get(channel)?.size || 0;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.activeChannels.keys());
  }
}
