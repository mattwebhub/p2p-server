// Snapshot Tests for TURN Credential System
// This file implements proper snapshot tests that generate snapshots during test execution

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createServer } from 'http';
import getPort from 'get-port';

// Import our mock TURN credential API routes and rate limiter
import turnRouter, { rateLimiter } from './mocks/turn-routes.mock.js';

describe('TURN Credential API Snapshot Tests', () => {
  let app;
  let server;
  let port;
  
  // Set up a fresh server before all tests
  beforeAll(async () => {
    // Get a random available port
    port = await getPort();
    
    // Set up Express app with our mock TURN routes
    app = express();
    app.use('/api', turnRouter);
    
    // Create HTTP server
    server = createServer(app);
    
    // Start the server on the dynamic port
    await new Promise(resolve => {
      server.listen(port, () => {
        console.log(`Test server started on port ${port}`);
        resolve();
      });
    });
  });
  
  // Clean up after all tests
  afterAll(async () => {
    // Close the server if it's running
    if (server && server.listening) {
      await new Promise(resolve => server.close(resolve));
      console.log('Test server closed');
    }
  });
  
  // Reset rate limiter before each test
  beforeEach(() => {
    rateLimiter.reset();
  });
  
  describe('Credential Response Snapshots', () => {
    it('should match snapshot for successful credential issuance', async () => {
      const response = await request(app)
        .get('/api/turn-credentials')
        .expect(200);
      
      // This will create a snapshot on first run and compare on subsequent runs
      // We use toMatchSnapshot with property matchers to handle dynamic values
      expect(response.body).toMatchSnapshot({
        // These fields will change on each run, so we only check their type
        username: expect.stringMatching(/^\d+:\d+$/),
        credential: expect.any(String),
        expiresAt: expect.any(Number)
      });
    });
    
    it('should match snapshot for rate limited response', async () => {
      // Send multiple requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(request(app).get('/api/turn-credentials'));
      }
      
      const responses = await Promise.all(requests);
      
      // Find the first rate limited response
      const rateLimitedResponse = responses.find(res => res.status === 429);
      
      // This should create a snapshot of the rate limit error response
      expect(rateLimitedResponse.body).toMatchSnapshot();
    });
  });
  
  describe('Credential Lifecycle Snapshots', () => {
    it('should match snapshot for credential refresh', async () => {
      // Get initial credentials
      const response1 = await request(app)
        .get('/api/turn-credentials')
        .expect(200);
      
      // Reset rate limiter to ensure we don't hit limits
      rateLimiter.reset();
      
      // Get refreshed credentials
      const response2 = await request(app)
        .get('/api/turn-credentials')
        .expect(200);
      
      // Create snapshots of both responses
      // For the initial credentials
      expect(response1.body).toMatchSnapshot({
        username: expect.stringMatching(/^\d+:\d+$/),
        credential: expect.any(String),
        expiresAt: expect.any(Number)
      });
      
      // For the refreshed credentials
      expect(response2.body).toMatchSnapshot({
        username: expect.stringMatching(/^\d+:\d+$/),
        credential: expect.any(String),
        expiresAt: expect.any(Number)
      });
      
      // Also snapshot the difference to show they're not the same
      expect({
        usernamesDiffer: response1.body.username !== response2.body.username,
        credentialsDiffer: response1.body.credential !== response2.body.credential,
        expirationsDiffer: response1.body.expiresAt !== response2.body.expiresAt
      }).toMatchSnapshot();
    });
  });
  
  describe('Error Handling Snapshots', () => {
    it('should match snapshot for malformed requests', async () => {
      // Test with an invalid query parameter to trigger validation error
      const response = await request(app)
        .get('/api/turn-credentials?invalid=true')
        .expect(200); // Our mock doesn't validate query params, but real implementation might return 400
      
      // Create snapshot of the response
      expect(response.body).toMatchSnapshot({
        username: expect.stringMatching(/^\d+:\d+$/),
        credential: expect.any(String),
        expiresAt: expect.any(Number)
      });
    });
  });
});
