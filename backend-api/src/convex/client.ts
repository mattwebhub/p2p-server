import { ConvexHttpClient } from 'convex/browser';
import { config } from '../shared/config';

// Initialize Convex client
let convexClient: ConvexHttpClient | null = null;

/**
 * Get or initialize the Convex client
 * @returns ConvexHttpClient instance
 */
export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    if (!config.convexUrl) {
      throw new Error('Convex URL is not configured');
    }
    
    convexClient = new ConvexHttpClient(config.convexUrl);
  }
  
  return convexClient;
}

/**
 * Reset the Convex client (mainly for testing)
 */
export function resetConvexClient(): void {
  convexClient = null;
}
