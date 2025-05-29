// TURN Credential System Test Fixture
// This file provides reusable test fixtures for TURN credential testing

import crypto from 'crypto';
import express from 'express';
import { createServer } from 'http';
import getPort from 'get-port';

/**
 * Fixture for TURN credential testing
 * Provides consistent test data and helper functions
 */
export class TurnCredentialFixture {
  /**
   * Default configuration for testing
   */
  static defaultConfig = {
    turnServer: {
      urls: [
        'turn:test.example.com:3478?transport=udp',
        'turn:test.example.com:3478?transport=tcp'
      ],
      host: '127.0.0.1',
      port: 3478,
      sharedSecret: 'test_secret_key',
      realm: 'test.example.com'
    },
    credentials: {
      ttl: 48 * 3600, // 48 hours in seconds
      username: '1622505600:172800', // Fixed timestamp:ttl for consistent testing
      credential: '', // Will be generated in constructor
      expiresAt: 1622505600 + 172800 // timestamp + ttl
    },
    rateLimiting: {
      maxRequests: 10,
      windowMs: 60000 // 1 minute
    }
  };

  constructor(config = {}) {
    // Merge provided config with defaults
    this.config = {
      ...TurnCredentialFixture.defaultConfig,
      ...config
    };

    // Generate credential using the shared secret
    const hmac = crypto.createHmac('sha1', this.config.turnServer.sharedSecret);
    hmac.update(this.config.credentials.username);
    this.config.credentials.credential = hmac.digest('base64');

    // Initialize state
    this.app = null;
    this.server = null;
    this.port = null;
    this.rateLimiter = {
      clients: new Map(),
      reset: () => this.rateLimiter.clients.clear()
    };
  }

  /**
   * Create a mock Express server with TURN credential API
   * @returns {Promise<{app: Express.Application, url: string}>}
   */
  async createMockServer() {
    // Create Express app
    this.app = express();

    // Create router with TURN credential endpoint
    const router = express.Router();
    router.get('/turn-credentials', this._createRateLimitMiddleware(), (req, res) => {
      try {
        // For testing, we can either use fixed credentials or generate new ones
        const useFixedCredentials = req.query.fixed === 'true';
        
        if (useFixedCredentials) {
          // Return fixed credentials for deterministic testing
          res.json({
            urls: this.config.turnServer.urls,
            username: this.config.credentials.username,
            credential: this.config.credentials.credential,
            credentialType: 'password',
            expiresAt: this.config.credentials.expiresAt
          });
        } else {
          // Generate time-limited credentials (like production)
          const now = Math.floor(Date.now() / 1000);
          const ttl = this.config.credentials.ttl;
          const expiresAt = now + ttl;
          
          // Format: timestamp + ttl (in seconds)
          const username = `${now}:${ttl}`;
          
          // Generate HMAC-SHA1 of the username using the shared secret
          const hmac = crypto.createHmac('sha1', this.config.turnServer.sharedSecret);
          hmac.update(username);
          const credential = hmac.digest('base64');
          
          // Return the credentials
          res.json({
            urls: this.config.turnServer.urls,
            username,
            credential,
            credentialType: 'password',
            expiresAt
          });
        }
      } catch (error) {
        console.error('Error generating TURN credentials:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to generate TURN credentials'
        });
      }
    });

    // Mount router
    this.app.use('/api', router);

    // Get a random available port
    this.port = await getPort();

    // Create HTTP server
    this.server = createServer(this.app);

    // Start the server
    await new Promise(resolve => {
      this.server.listen(this.port, () => {
        resolve();
      });
    });

    return {
      app: this.app,
      url: `http://localhost:${this.port}`
    };
  }

  /**
   * Stop the mock server
   * @returns {Promise<void>}
   */
  async stopMockServer() {
    if (this.server && this.server.listening) {
      await new Promise(resolve => this.server.close(resolve));
      this.server = null;
    }
  }

  /**
   * Create middleware for rate limiting
   * @returns {Function} Express middleware
   * @private
   */
  _createRateLimitMiddleware() {
    return (req, res, next) => {
      const ip = req.ip || '127.0.0.1';
      
      // Clean expired entries
      this._cleanRateLimiter();
      
      // Get or create client entry
      let client = this.rateLimiter.clients.get(ip);
      const now = Date.now();
      
      if (!client) {
        client = {
          windowStart: now,
          count: 0
        };
        this.rateLimiter.clients.set(ip, client);
      } else if (now - client.windowStart > this.config.rateLimiting.windowMs) {
        // Reset if window expired
        client.windowStart = now;
        client.count = 0;
      }
      
      // Increment request count
      client.count++;
      
      // Check if over limit
      if (client.count > this.config.rateLimiting.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Try again later.'
        });
      }
      
      next();
    };
  }

  /**
   * Clean expired rate limiter entries
   * @private
   */
  _cleanRateLimiter() {
    const now = Date.now();
    for (const [ip, data] of this.rateLimiter.clients.entries()) {
      if (now - data.windowStart > this.config.rateLimiting.windowMs) {
        this.rateLimiter.clients.delete(ip);
      }
    }
  }

  /**
   * Reset rate limiter state
   */
  resetRateLimiter() {
    this.rateLimiter.reset();
  }

  /**
   * Verify if a credential is valid
   * @param {string} username - Username in format timestamp:ttl
   * @param {string} credential - HMAC-SHA1 credential
   * @returns {boolean} True if credential is valid
   */
  verifyCredential(username, credential) {
    const hmac = crypto.createHmac('sha1', this.config.turnServer.sharedSecret);
    hmac.update(username);
    const expectedCredential = hmac.digest('base64');
    return credential === expectedCredential;
  }

  /**
   * Check if credentials are expired
   * @param {Object} credentials - Credentials object with expiresAt property
   * @returns {boolean} True if credentials are expired
   */
  isExpired(credentials) {
    const now = Math.floor(Date.now() / 1000);
    return credentials.expiresAt < now;
  }

  /**
   * Get time remaining for credentials in seconds
   * @param {Object} credentials - Credentials object with expiresAt property
   * @returns {number} Seconds remaining, or 0 if expired
   */
  getTimeRemaining(credentials) {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, credentials.expiresAt - now);
  }

  /**
   * Create a STUN binding request buffer
   * @returns {Buffer} STUN binding request
   */
  createStunBindingRequest() {
    // STUN Message Type: Binding Request (0x0001)
    // Message Length: 0 bytes (0x0000)
    // Magic Cookie: 0x2112A442
    // Transaction ID: 12 random bytes
    const header = Buffer.alloc(20);
    header.writeUInt16BE(0x0001, 0); // Message Type
    header.writeUInt16BE(0x0000, 2); // Message Length
    header.writeUInt32BE(0x2112A442, 4); // Magic Cookie
    
    // Generate random Transaction ID
    crypto.randomFillSync(header, 8, 12);
    
    return header;
  }

  /**
   * Create a TURN allocate request buffer with authentication
   * @param {string} username - Username for authentication
   * @param {string} credential - Credential for authentication
   * @param {string} realm - Realm for authentication
   * @returns {Buffer} TURN allocate request
   */
  createTurnAllocateRequest(username, credential, realm) {
    // TURN Message Type: Allocate Request (0x0003)
    // We'll need to add several attributes:
    // - REQUESTED-TRANSPORT (0x0019)
    // - USERNAME (0x0006)
    // - REALM (0x0014)
    // - NONCE (0x0015)
    
    // For testing purposes, we'll use a dummy nonce
    const nonce = "dummy_nonce_" + Date.now();
    
    // Create the base message
    const msg = Buffer.alloc(1000); // Allocate enough space
    let offset = 0;
    
    // Header
    msg.writeUInt16BE(0x0003, offset); // Allocate Request
    offset += 2;
    // Message Length will be filled in later
    offset += 2;
    msg.writeUInt32BE(0x2112A442, offset); // Magic Cookie
    offset += 4;
    // Transaction ID
    crypto.randomFillSync(msg, offset, 12);
    offset += 12;
    
    // REQUESTED-TRANSPORT attribute (0x0019)
    msg.writeUInt16BE(0x0019, offset); // Type
    offset += 2;
    msg.writeUInt16BE(4, offset); // Length
    offset += 2;
    msg.writeUInt8(17, offset); // UDP (17)
    offset += 1;
    // 3 bytes padding
    msg.writeUInt8(0, offset++);
    msg.writeUInt8(0, offset++);
    msg.writeUInt8(0, offset++);
    
    // USERNAME attribute (0x0006)
    const usernameBuffer = Buffer.from(username);
    const usernamePadding = (4 - (usernameBuffer.length % 4)) % 4;
    msg.writeUInt16BE(0x0006, offset); // Type
    offset += 2;
    msg.writeUInt16BE(usernameBuffer.length, offset); // Length
    offset += 2;
    usernameBuffer.copy(msg, offset);
    offset += usernameBuffer.length;
    // Add padding
    for (let i = 0; i < usernamePadding; i++) {
      msg.writeUInt8(0, offset++);
    }
    
    // REALM attribute (0x0014)
    const realmBuffer = Buffer.from(realm);
    const realmPadding = (4 - (realmBuffer.length % 4)) % 4;
    msg.writeUInt16BE(0x0014, offset); // Type
    offset += 2;
    msg.writeUInt16BE(realmBuffer.length, offset); // Length
    offset += 2;
    realmBuffer.copy(msg, offset);
    offset += realmBuffer.length;
    // Add padding
    for (let i = 0; i < realmPadding; i++) {
      msg.writeUInt8(0, offset++);
    }
    
    // NONCE attribute (0x0015)
    const nonceBuffer = Buffer.from(nonce);
    const noncePadding = (4 - (nonceBuffer.length % 4)) % 4;
    msg.writeUInt16BE(0x0015, offset); // Type
    offset += 2;
    msg.writeUInt16BE(nonceBuffer.length, offset); // Length
    offset += 2;
    nonceBuffer.copy(msg, offset);
    offset += nonceBuffer.length;
    // Add padding
    for (let i = 0; i < noncePadding; i++) {
      msg.writeUInt8(0, offset++);
    }
    
    // Calculate message length (excluding header)
    const messageLength = offset - 20;
    msg.writeUInt16BE(messageLength, 2);
    
    // MESSAGE-INTEGRITY attribute would be added here in a real implementation
    // This requires calculating an HMAC-SHA1 over the message
    // For simplicity, we're omitting this in our test helper
    
    return msg.slice(0, offset);
  }

  /**
   * Get fixed test credentials
   * @returns {Object} Fixed credentials for testing
   */
  getFixedCredentials() {
    return {
      urls: this.config.turnServer.urls,
      username: this.config.credentials.username,
      credential: this.config.credentials.credential,
      credentialType: 'password',
      expiresAt: this.config.credentials.expiresAt
    };
  }
}

/**
 * Example usage:
 * 
 * // Create fixture with default config
 * const fixture = new TurnCredentialFixture();
 * 
 * // Start mock server
 * const { app, url } = await fixture.createMockServer();
 * 
 * // Make requests to the server
 * const response = await fetch(`${url}/api/turn-credentials`);
 * const credentials = await response.json();
 * 
 * // Verify credentials
 * const isValid = fixture.verifyCredential(credentials.username, credentials.credential);
 * 
 * // Check expiration
 * const isExpired = fixture.isExpired(credentials);
 * 
 * // Get time remaining
 * const timeRemaining = fixture.getTimeRemaining(credentials);
 * 
 * // Reset rate limiter for testing
 * fixture.resetRateLimiter();
 * 
 * // Stop server when done
 * await fixture.stopMockServer();
 */

export default TurnCredentialFixture;
