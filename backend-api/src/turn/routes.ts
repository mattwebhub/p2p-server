import express from 'express';
import { turnCredentialService } from './service';
import { rateLimit } from 'express-rate-limit';

// Create router
export const turnRouter = express.Router();

// Apply rate limiting to prevent abuse
// Limit to 10 requests per minute per IP
const credentialLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

/**
 * GET /api/turn-credentials
 * Returns TURN server credentials for WebRTC connections
 */
turnRouter.get('/turn-credentials', credentialLimiter, (req, res) => {
  try {
    // Generate fresh credentials
    const credentials = turnCredentialService.generateCredentials();
    
    // Return credentials to client
    res.status(200).json(credentials);
  } catch (error) {
    console.error('Error generating TURN credentials:', error);
    res.status(500).json({ error: 'Failed to generate TURN credentials' });
  }
});

export default turnRouter;
