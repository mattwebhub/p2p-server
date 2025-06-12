import express from 'express';
import { turnCredentialService } from './service';
import rateLimit from 'express-rate-limit';
import { TurnCredentialsRequestSchema, TurnCredentialsResponseSchema } from './schema';
import { validateRequest } from '../shared/middleware/validation';

// Create router
export const turnRouter = express.Router();

// Apply rate limiting to prevent abuse
// Limit to 10 requests per minute per IP
const credentialLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: 'Too many requests, please try again later'
});

/**
 * GET /api/turn-credentials
 * Returns TURN server credentials for WebRTC connections
 */
turnRouter.get('/turn-credentials', 
  credentialLimiter,
  validateRequest(TurnCredentialsRequestSchema, 'query'),
  (req, res, next) => {
    try {
      // Generate fresh credentials using validated query parameters
      const credentials = turnCredentialService.generateCredentials(req.query.username as string || "");
      
      // Validate response data
      const responseValidation = TurnCredentialsResponseSchema.safeParse(credentials);
      if (!responseValidation.success) {
        console.error('Invalid TURN credentials format:', responseValidation.error);
        return next(new Error('Failed to generate valid TURN credentials'));
      }
      
      // Return credentials to client
      res.status(200).json(responseValidation.data);
    } catch (error) {
      next(error);
    }
  }
);

export default turnRouter;
