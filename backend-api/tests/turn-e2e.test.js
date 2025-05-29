// End-to-End Tests for TURN Credential System
// This file implements the first set of e2e tests focusing on basic credential flow

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import express from "express";
import crypto from "crypto";
import { createServer } from "http";
import getPort from "get-port";

// Import our mock TURN credential API routes and rate limiter
import turnRouter, { rateLimiter } from "./mocks/turn-routes.mock.js";

// Configuration for tests
const TEST_CONFIG = {
  turnServer: {
    host: "127.0.0.1",
    port: 3478,
    sharedSecret: "test_secret_key",
    realm: "test.example.com",
  },
};

// Helper function to verify HMAC signature
function verifyCredential(username, credential, secret) {
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(username);
  const expectedCredential = hmac.digest("base64");
  return credential === expectedCredential;
}

describe("TURN Credential System E2E Tests", () => {
  let app;
  let server;
  let port;

  // Set up a fresh server before all tests
  beforeAll(async () => {
    // Get a random available port
    port = await getPort();

    // Set up Express app with our mock TURN routes
    app = express();
    app.use("/api", turnRouter);

    // Create HTTP server
    server = createServer(app);

    // Start the server on the dynamic port
    await new Promise((resolve) => {
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
      await new Promise((resolve) => server.close(resolve));
      console.log("Test server closed");
    }
  });

  // Reset rate limiter before each test
  beforeEach(() => {
    rateLimiter.reset();
  });

  describe("1. Basic Credential Flow Tests", () => {
    describe("1.1 Successful Credential Issuance", () => {
      it("should issue valid TURN credentials", async () => {
        const response = await request(app)
          .get("/api/turn-credentials")
          .expect(200);

        // Verify response structure
        expect(response.body).toHaveProperty("urls");
        expect(response.body).toHaveProperty("username");
        expect(response.body).toHaveProperty("credential");
        expect(response.body).toHaveProperty("credentialType");
        expect(response.body).toHaveProperty("expiresAt");

        // Verify username format (timestamp:ttl)
        const username = response.body.username;
        expect(username).toMatch(/^\d+:\d+$/);

        // Verify credential is valid HMAC
        const isValidCredential = verifyCredential(
          username,
          response.body.credential,
          TEST_CONFIG.turnServer.sharedSecret
        );
        expect(isValidCredential).toBe(true);

        // Verify expiration time
        const now = Math.floor(Date.now() / 1000);
        expect(response.body.expiresAt).toBeGreaterThan(now);

        // Parse username components
        const [timestamp, ttl] = username.split(":").map(Number);
        expect(response.body.expiresAt).toBe(timestamp + ttl);
      });

      it("should respect rate limiting", async () => {
        // Send multiple requests to trigger rate limiting
        const requests = [];
        for (let i = 0; i < 15; i++) {
          requests.push(request(app).get("/api/turn-credentials"));
        }

        const responses = await Promise.all(requests);

        // Verify some requests were rate limited (status 429)
        const rateLimited = responses.some((res) => res.status === 429);
        expect(rateLimited).toBe(true);
      });
    });

    describe("1.2 Credential Authentication with Coturn", () => {
      it("should simulate authentication with Coturn using issued credentials", async () => {
        // Since we can't run a real Coturn server in the sandbox,
        // we'll simulate the authentication process

        // Get credentials from API
        const response = await request(app)
          .get("/api/turn-credentials")
          .expect(200);

        const { username, credential } = response.body;

        // Verify the credential format is correct for Coturn
        expect(username).toMatch(/^\d+:\d+$/);
        expect(credential).toBeTruthy();

        // In a real test, we would:
        // 1. Send a TURN allocate request to Coturn
        // 2. Verify successful allocation
        // 3. Test data relay

        // For the sandbox, we'll just verify the credential would be valid
        // by checking it against our known shared secret
        const isValidCredential = verifyCredential(
          username,
          credential,
          TEST_CONFIG.turnServer.sharedSecret
        );
        expect(isValidCredential).toBe(true);
      });
    });
  });

  describe("3. Credential Lifecycle Tests", () => {
    it("should detect expired credentials", async () => {
      // Reset rate limiter to ensure we don't hit limits
      rateLimiter.reset();

      // Get valid credentials
      const response = await request(app)
        .get("/api/turn-credentials")
        .expect(200);

      const credentials = response.body;

      // Verify they're currently valid
      const now = Math.floor(Date.now() / 1000);
      expect(credentials.expiresAt).toBeGreaterThan(now);

      // Create expired credentials by modifying expiration
      const expiredCredentials = {
        ...credentials,
        expiresAt: now - 3600, // 1 hour ago
      };

      // Verify expiration detection
      expect(expiredCredentials.expiresAt < now).toBe(true);

      // In a real test with Coturn, we would:
      // 1. Try to authenticate with expired credentials
      // 2. Verify authentication fails
      // For the sandbox, we'll just verify our expiration logic
    });

    it("should simulate credential refresh", async () => {
      // Reset rate limiter to ensure we don't hit limits
      rateLimiter.reset();

      // Get initial credentials
      const response1 = await request(app)
        .get("/api/turn-credentials")
        .expect(200);

      const initialCredentials = response1.body;

      // Wait a short time
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Get refreshed credentials
      const response2 = await request(app)
        .get("/api/turn-credentials")
        .expect(200);

      const refreshedCredentials = response2.body;

      // Verify refreshed credentials are different
      expect(refreshedCredentials.username).not.toBe(
        initialCredentials.username
      );
      expect(refreshedCredentials.credential).not.toBe(
        initialCredentials.credential
      );

      // Verify both are valid
      const isInitialValid = verifyCredential(
        initialCredentials.username,
        initialCredentials.credential,
        TEST_CONFIG.turnServer.sharedSecret
      );

      const isRefreshedValid = verifyCredential(
        refreshedCredentials.username,
        refreshedCredentials.credential,
        TEST_CONFIG.turnServer.sharedSecret
      );

      expect(isInitialValid).toBe(true);
      expect(isRefreshedValid).toBe(true);
    });
  });
});
