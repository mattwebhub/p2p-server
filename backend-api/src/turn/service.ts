import TurnConfig, { TurnCredentials } from './config';

export class TurnCredentialService {
  /**
   * Generate time-limited TURN credentials
   * @returns TurnCredentials object with username, credential, and expiration
   */
  public generateCredentials(username: string): TurnCredentials {
    return TurnConfig.generateCredentials();
  }

  /**
   * Verify if the provided credentials are still valid
   * @param credentials The credentials to verify
   * @returns boolean indicating if credentials are still valid
   */
  public verifyCredentials(credentials: TurnCredentials): boolean {
    const now = Math.floor(Date.now() / 1000);
    return credentials.expiresAt > now;
  }

  /**
   * Calculate time remaining for credentials in seconds
   * @param credentials The credentials to check
   * @returns Number of seconds until expiration, or 0 if expired
   */
  public getTimeRemaining(credentials: TurnCredentials): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, credentials.expiresAt - now);
  }
}

// Export a singleton instance
export const turnCredentialService = new TurnCredentialService();
export default turnCredentialService;
