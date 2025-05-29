import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Centralized error handling middleware for Express
 * Formats and standardizes error responses across the API
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error caught by central error handler:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string> = {};
    
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      formattedErrors[path] = error.message;
    });
    
    return res.status(400).json({
      error: 'Validation error',
      details: formattedErrors
    });
  }

  // Handle other known error types
  // TODO: Add custom error classes and their handling

  // Default error response
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
};
