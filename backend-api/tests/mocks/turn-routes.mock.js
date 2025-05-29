// Mock implementation of the TURN routes for e2e testing
import express from 'express';
import crypto from 'crypto';

// Create a router
const router = express.Router();

// Configuration for the mock TURN service
const config = {
  urls: [
    'turn:test.example.com:3478?transport=udp',
    'turn:test.example.com:3478?transport=tcp'
  ],
  sharedSecret: 'test_secret_key',
  credentialTTL: 48 // hours
};

// Rate limiting state - exported so it can be reset between tests
export const rateLimiter = {
  clients: new Map(),
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  clean: function() {
    const now = Date.now();
    for (const [ip, data] of this.clients.entries()) {
      if (now - data.windowStart > this.windowMs) {
        this.clients.delete(ip);
      }
    }
  },
  reset: function() {
    this.clients.clear();
  }
};

// Middleware for basic rate limiting
function rateLimit(req, res, next) {
  const ip = req.ip || '127.0.0.1';
  
  // Clean expired entries
  rateLimiter.clean();
  
  // Get or create client entry
  let client = rateLimiter.clients.get(ip);
  const now = Date.now();
  
  if (!client) {
    client = {
      windowStart: now,
      count: 0
    };
    rateLimiter.clients.set(ip, client);
  } else if (now - client.windowStart > rateLimiter.windowMs) {
    // Reset if window expired
    client.windowStart = now;
    client.count = 0;
  }
  
  // Increment request count
  client.count++;
  
  // Check if over limit
  if (client.count > rateLimiter.maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Try again later.'
    });
  }
  
  next();
}

// TURN credential endpoint
router.get('/turn-credentials', rateLimit, (req, res) => {
  try {
    // Generate time-limited credentials
    const now = Math.floor(Date.now() / 1000);
    const ttl = config.credentialTTL * 3600; // Convert hours to seconds
    const expiresAt = now + ttl;
    
    // Format: timestamp + ttl (in seconds)
    const username = `${now}:${ttl}`;
    
    // Generate HMAC-SHA1 of the username using the shared secret
    const hmac = crypto.createHmac('sha1', config.sharedSecret);
    hmac.update(username);
    const credential = hmac.digest('base64');
    
    // Return the credentials
    res.json({
      urls: config.urls,
      username,
      credential,
      credentialType: 'password',
      expiresAt
    });
  } catch (error) {
    console.error('Error generating TURN credentials:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate TURN credentials'
    });
  }
});

export default router;
