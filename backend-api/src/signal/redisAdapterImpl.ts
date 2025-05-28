import Redis from 'redis';
import { RedisAdapter } from './redisAdapter';

export class RedisAdapterImpl implements RedisAdapter {
  private publisher: Redis.RedisClientType;
  private subscriber: Redis.RedisClientType;
  private isConnected = false;

  constructor(redisUrl: string) {
    this.publisher = Redis.createClient({ url: redisUrl });
    this.subscriber = Redis.createClient({ url: redisUrl });
    
    this.publisher.on('error', (err) => console.error('Redis Publisher Error:', err));
    this.subscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.publisher.connect();
      await this.subscriber.connect();
      this.isConnected = true;
      console.log('Connected to Redis');
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.publisher.disconnect();
      await this.subscriber.disconnect();
      this.isConnected = false;
      console.log('Disconnected from Redis');
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
    await this.subscriber.subscribe(channel, callback);
  }

  async unsubscribe(channel: string): Promise<void> {
    if (this.isConnected) {
      await this.subscriber.unsubscribe(channel);
    }
  }
}
