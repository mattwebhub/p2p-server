import { getConvexClient } from './client';

export interface User {
  uid: string;
  handle: string;
  created: number;
}

export class UserService {
  constructor() {
    // No client parameter needed as we'll get it from the client module
  }

  async createUser(user: User): Promise<string> {
    try {
      const client = getConvexClient();
      return await client.mutation('users:create', user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(uid: string): Promise<User | null> {
    try {
      const client = getConvexClient();
      return await client.query('users:getById', { uid });
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async updateUser(uid: string, updateData: { handle?: string }): Promise<string> {
    try {
      const client = getConvexClient();
      return await client.mutation('users:update', { uid, ...updateData });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<boolean> {
    try {
      const client = getConvexClient();
      return await client.mutation('users:delete', { uid });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
