import { getConvexClient } from './client';
import { User, UserSchema } from './types';

/**
 * User service for interacting with Convex users table
 */
export class UserService {
  /**
   * Create a new user
   * @param user User data to create
   * @returns Created user ID
   */
  async createUser(user: User): Promise<string> {
    try {
      // Validate user data
      const validatedUser = UserSchema.parse(user);
      
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to create user
      const userId = await client.mutation('users:create', {
        uid: validatedUser.uid,
        handle: validatedUser.handle,
        created: validatedUser.created
      });
      
      return userId as string;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get a user by ID
   * @param uid User ID
   * @returns User data or null if not found
   */
  async getUserById(uid: string): Promise<User | null> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex query to get user
      const user = await client.query('users:getById', { uid });
      
      return user as User | null;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update a user
   * @param uid User ID
   * @param userData User data to update
   * @returns Updated user ID
   */
  async updateUser(uid: string, userData: Partial<User>): Promise<string> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to update user
      const userId = await client.mutation('users:update', {
        uid,
        ...userData
      });
      
      return userId as string;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a user
   * @param uid User ID
   * @returns Success status
   */
  async deleteUser(uid: string): Promise<boolean> {
    try {
      // Get Convex client
      const client = getConvexClient();
      
      // Call Convex mutation to delete user
      await client.mutation('users:delete', { uid });
      
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
