import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../src/shared/middleware/validation';
import { z } from 'zod';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let responseObject: any = {};

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {};
    responseObject = {
      statusCode: 0,
      body: null
    };
    mockResponse = {
      status: vi.fn().mockImplementation((code) => {
        responseObject.statusCode = code;
        return mockResponse;
      }),
      json: vi.fn().mockImplementation((data) => {
        responseObject.body = data;
        return mockResponse;
      })
    };
    nextFunction = vi.fn();
  });

  describe('validateRequest', () => {
    it('should call next() when validation passes for body', () => {
      // Setup
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive()
      });
      
      mockRequest.body = { name: 'John', age: 30 };
      const middleware = validateRequest(schema, 'body');

      // Execute
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Verify
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 when body validation fails', () => {
      // Setup
      const schema = z.object({
        name: z.string(),
        age: z.number().int().positive()
      });
      
      mockRequest.body = { name: 'John', age: -5 }; // Invalid age
      const middleware = validateRequest(schema, 'body');

      // Execute
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Verify
      expect(nextFunction).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toHaveProperty('error');
      expect(responseObject.body.error).toBe('Invalid body parameters');
    });

    it('should validate query parameters correctly', () => {
      // Setup
      const schema = z.object({
        limit: z.coerce.number().int().positive().optional().default(10),
        offset: z.coerce.number().int().nonnegative().optional().default(0)
      });
      
      mockRequest.query = { limit: '20' };
      const middleware = validateRequest(schema, 'query');

      // Execute
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Verify
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({ limit: 20, offset: 0 }); // Coerced and default values
    });

    it('should validate URL parameters correctly', () => {
      // Setup
      const schema = z.object({
        id: z.string().uuid()
      });
      
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' }; // Valid UUID
      const middleware = validateRequest(schema, 'params');

      // Execute
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Verify
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 400 when URL parameter validation fails', () => {
      // Setup
      const schema = z.object({
        id: z.string().uuid()
      });
      
      mockRequest.params = { id: 'not-a-uuid' }; // Invalid UUID
      const middleware = validateRequest(schema, 'params');

      // Execute
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Verify
      expect(nextFunction).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toHaveProperty('error');
    });
  });
});
