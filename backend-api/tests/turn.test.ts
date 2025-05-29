import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TurnConfig from '../src/turn/config';
import { TurnCredentialService } from '../src/turn/service';

// Mock crypto module with the validated approach from crypto-mock.test.ts
vi.mock('crypto', () => {
  // Create a mock HMAC object with chaining methods
  const mockHmacInstance = {
    update: vi.fn(function(data) {
      return this; // Return this for chaining
    }),
    digest: vi.fn(() => 'mocked_credential')
  };
  
  // Create the createHmac function that returns our mock instance
  const mockCreateHmac = vi.fn(() => mockHmacInstance);
  
  // Create the mock object with both named and default exports
  return {
    createHmac: mockCreateHmac,
    default: {
      createHmac: mockCreateHmac
    }
  };
});

describe('TURN Credential System', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let turnCredentialService: TurnCredentialService;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set test environment variables
    process.env.TURN_SERVER_URI_UDP = 'turn:test.example.com:3478?transport=udp';
    process.env.TURN_SERVER_URI_TCP = 'turn:test.example.com:3478?transport=tcp';
    process.env.TURN_SHARED_SECRET = 'test_secret_key';
    process.env.TURN_CREDENTIAL_TTL = '24';
    
    // Reset TurnConfig to use new environment variables
    TurnConfig.updateConfig({
      urls: [
        process.env.TURN_SERVER_URI_UDP,
        process.env.TURN_SERVER_URI_TCP
      ],
      sharedSecret: process.env.TURN_SHARED_SECRET,
      credentialTTL: parseInt(process.env.TURN_CREDENTIAL_TTL, 10)
    });
    
    // Create service
    turnCredentialService = new TurnCredentialService();
    
    // Mock Date.now for deterministic testing
    vi.spyOn(Date, 'now').mockImplementation(() => 1622505600000); // 2021-06-01T00:00:00.000Z
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore Date.now
    vi.restoreAllMocks();
  });
  
  describe('TurnConfig', () => {
    it('should load configuration from environment variables', () => {
      const config = TurnConfig.getConfig();
      
      expect(config.urls).toEqual([
        'turn:test.example.com:3478?transport=udp',
        'turn:test.example.com:3478?transport=tcp'
      ]);
      expect(config.sharedSecret).toBe('test_secret_key');
      expect(config.credentialTTL).toBe(24);
    });
    
    it('should generate credentials with correct format', () => {
      const credentials = TurnConfig.generateCredentials();
      
      // Check timestamp format (current time in seconds)
      expect(credentials.username).toMatch(/^\d+:\d+$/);
      
      // Check credential structure
      expect(credentials).toEqual({
        urls: [
          'turn:test.example.com:3478?transport=udp',
          'turn:test.example.com:3478?transport=tcp'
        ],
        username: '1622505600:86400', // timestamp:ttl
        credential: 'mocked_credential',
        credentialType: 'password',
        expiresAt: 1622592000 // timestamp + ttl
      });
    });
  });
  
  describe('TurnCredentialService', () => {
    it('should generate valid credentials', () => {
      const credentials = turnCredentialService.generateCredentials();
      
      expect(credentials.urls).toHaveLength(2);
      expect(credentials.username).toBeDefined();
      expect(credentials.credential).toBeDefined();
      expect(credentials.credentialType).toBe('password');
      expect(credentials.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
    
    it('should verify valid credentials', () => {
      const credentials = turnCredentialService.generateCredentials();
      
      expect(turnCredentialService.verifyCredentials(credentials)).toBe(true);
    });
    
    it('should reject expired credentials', () => {
      const credentials = turnCredentialService.generateCredentials();
      
      // Modify expiration to be in the past
      const expiredCredentials = {
        ...credentials,
        expiresAt: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      
      expect(turnCredentialService.verifyCredentials(expiredCredentials)).toBe(false);
    });
    
    it('should calculate time remaining correctly', () => {
      const credentials = turnCredentialService.generateCredentials();
      const expectedTimeRemaining = credentials.expiresAt - Math.floor(Date.now() / 1000);
      
      expect(turnCredentialService.getTimeRemaining(credentials)).toBe(expectedTimeRemaining);
    });
    
    it('should return 0 for expired credentials', () => {
      const credentials = turnCredentialService.generateCredentials();
      
      // Modify expiration to be in the past
      const expiredCredentials = {
        ...credentials,
        expiresAt: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      
      expect(turnCredentialService.getTimeRemaining(expiredCredentials)).toBe(0);
    });
  });
});
