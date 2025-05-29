// Configuration for TURN server and credential generation
import crypto from 'crypto';

export interface TurnServerConfig {
  urls: string[];
  sharedSecret: string;
  credentialTTL: number; // in hours
}

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
  credentialType: 'password';
  expiresAt: number;
}

export class TurnConfig {
  private static instance: TurnConfig;
  private config: TurnServerConfig;

  private constructor() {
    // Default configuration - should be overridden from environment variables in production
    this.config = {
      urls: [
        process.env.TURN_SERVER_URI_UDP || 'turn:turn.example.com:3478?transport=udp',
        process.env.TURN_SERVER_URI_TCP || 'turn:turn.example.com:3478?transport=tcp'
      ],
      sharedSecret: process.env.TURN_SHARED_SECRET || 'default_secret_key_change_in_production',
      credentialTTL: parseInt(process.env.TURN_CREDENTIAL_TTL || '48', 10) // Default 48 hours
    };
  }

  public static getInstance(): TurnConfig {
    if (!TurnConfig.instance) {
      TurnConfig.instance = new TurnConfig();
    }
    return TurnConfig.instance;
  }

  public getConfig(): TurnServerConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<TurnServerConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Generate TURN credentials using the REST API mechanism
   * @returns TurnCredentials object with time-limited credentials
   */
  public generateCredentials(): TurnCredentials {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const ttl = this.config.credentialTTL * 3600; // Convert hours to seconds
    const expiresAt = now + ttl;
    
    // Format: timestamp + ttl (in seconds)
    const username = `${now}:${ttl}`;
    
    // Generate HMAC-SHA1 of the username using the shared secret
    const hmac = crypto.createHmac('sha1', this.config.sharedSecret);
    hmac.update(username);
    const credential = hmac.digest('base64');
    
    return {
      urls: this.config.urls,
      username,
      credential,
      credentialType: 'password',
      expiresAt
    };
  }
}

export default TurnConfig.getInstance();
