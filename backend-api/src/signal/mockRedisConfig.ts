// Mock Redis adapter configuration for development
import { MockRedisAdapter } from './redisAdapter';

// Create and export a singleton instance of the MockRedisAdapter
const mockRedisAdapter = new MockRedisAdapter();

export default mockRedisAdapter;
