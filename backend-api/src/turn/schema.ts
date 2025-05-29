import { z } from 'zod';

/**
 * Schema for TURN credentials request parameters
 * Optional username can be provided, otherwise one will be generated
 */
export const TurnCredentialsRequestSchema = z.object({
  username: z.string().optional(),
});
export type TurnCredentialsRequest = z.infer<typeof TurnCredentialsRequestSchema>;

/**
 * Schema for TURN credentials response
 * Ensures all required fields are present and properly typed
 */
export const TurnCredentialsResponseSchema = z.object({
  username: z.string(),
  password: z.string(),
  ttl: z.number().int().positive(),
  urls: z.array(z.string().url()),
});
export type TurnCredentialsResponse = z.infer<typeof TurnCredentialsResponseSchema>;
