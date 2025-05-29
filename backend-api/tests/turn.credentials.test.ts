import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { turnRouter } from '../src/turn/routes';
import { turnCredentialService } from '../src/turn/service';
import supertest from 'supertest';
import express from 'express';

// Mock the turn credential service
vi.mock('../src/turn/service', () => ({
  turnCredentialService: {
    generateCredentials: vi.fn()
  }
}));

describe('TURN Credentials API', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a test Express app
    app = express();
    app.use(express.json());
    app.use('/api', turnRouter);
  });

  describe('GET /turn-credentials', () => {
    it('should return valid TURN credentials', async () => {
      // Setup
      const mockCredentials = {
        username: 'testuser',
        password: 'testpassword',
        ttl: 86400,
        urls: ['turn:test.example.com:3478']
      };
      
      vi.mocked(turnCredentialService.generateCredentials).mockReturnValue(mockCredentials);

      // Execute & Verify
      const response = await supertest(app)
        .get('/api/turn-credentials')
        .expect(200);
      
      expect(response.body).toEqual(mockCredentials);
      expect(turnCredentialService.generateCredentials).toHaveBeenCalled();
    });

    it('should accept optional username parameter', async () => {
      // Setup
      const username = 'customuser';
      const mockCredentials = {
        username,
        password: 'testpassword',
        ttl: 86400,
        urls: ['turn:test.example.com:3478']
      };
      
      vi.mocked(turnCredentialService.generateCredentials).mockReturnValue(mockCredentials);

      // Execute & Verify
      const response = await supertest(app)
        .get(`/api/turn-credentials?username=${username}`)
        .expect(200);
      
      expect(response.body).toEqual(mockCredentials);
      expect(turnCredentialService.generateCredentials).toHaveBeenCalledWith(username);
    });

    it('should handle invalid response data from service', async () => {
      // Setup - missing required fields
      const invalidCredentials = {
        username: 'testuser',
        // Missing password, ttl, and urls
      };
      
      vi.mocked(turnCredentialService.generateCredentials).mockReturnValue(invalidCredentials as any);

      // Execute & Verify
      const response = await supertest(app)
        .get('/api/turn-credentials')
        .expect(500);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});
