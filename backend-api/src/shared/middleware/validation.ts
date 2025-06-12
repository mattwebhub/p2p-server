import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware factory for validating request components using Zod schemas
 * 
 * @param schema The Zod schema to validate against
 * @param source Which part of the request to validate ('body', 'query', 'params')
 * @returns Express middleware function that validates the request
 */
export const validateRequest = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const parseResult = schema.safeParse(data);
      
      if (!parseResult.success) {
        res.status(400).json({
          error: `Invalid ${source} parameters`,
          details: formatZodError(parseResult.error)
        });
        return;
      }
      
      // Replace the request data with the validated and transformed data
      req[source] = parseResult.data;
      return next();
    } catch (error) {
      console.error(`Validation error in ${source}:`, error);
      res.status(500).json({ error: 'Internal server error during validation' });
      return;
    }
  };
};

/**
 * Format Zod validation errors into a more user-friendly structure
 * 
 * @param error The Zod error object
 * @returns A formatted error object with field paths as keys
 */
export const formatZodError = (error: ZodError) => {
  const formattedErrors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formattedErrors[path] = err.message;
  });
  
  return formattedErrors;
};
