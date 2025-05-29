import { Request, Response, NextFunction } from 'express';

// CORS middleware for enabling cross-origin requests
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Allow requests from any origin during development
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow specific HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Allow specific headers
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};
