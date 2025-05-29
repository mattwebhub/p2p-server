import { describe, it, expect, vi } from 'vitest';

// Create a minimal test file to validate crypto mocking

// First, let's create a simple mock that should work with both default and named imports
vi.mock('crypto', () => {
  // Create a mock HMAC object with chaining methods
  const mockHmacInstance = {
    update: vi.fn(function(data) {
      return this; // Return this for chaining
    }),
    digest: vi.fn(() => 'mocked_digest_result')
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

// Import crypto both ways to test our mock
import cryptoDefault from 'crypto';
import * as cryptoNamed from 'crypto';

describe('Crypto Mock Validation', () => {
  it('should mock default import correctly', () => {
    // Test default import
    const hmac1 = cryptoDefault.createHmac('sha1', 'test-secret');
    expect(hmac1.update).toBeDefined();
    expect(hmac1.digest).toBeDefined();
    
    // Test chaining
    const result1 = hmac1.update('test-data').digest();
    expect(result1).toBe('mocked_digest_result');
    
    // Verify the mock was called with correct parameters
    expect(cryptoDefault.createHmac).toHaveBeenCalledWith('sha1', 'test-secret');
    expect(hmac1.update).toHaveBeenCalledWith('test-data');
    expect(hmac1.digest).toHaveBeenCalled();
  });
  
  it('should mock named import correctly', () => {
    // Test named import
    const hmac2 = cryptoNamed.createHmac('sha1', 'test-secret');
    expect(hmac2.update).toBeDefined();
    expect(hmac2.digest).toBeDefined();
    
    // Test chaining
    const result2 = hmac2.update('test-data').digest();
    expect(result2).toBe('mocked_digest_result');
    
    // Verify the mock was called with correct parameters
    expect(cryptoNamed.createHmac).toHaveBeenCalledWith('sha1', 'test-secret');
    expect(hmac2.update).toHaveBeenCalledWith('test-data');
    expect(hmac2.digest).toHaveBeenCalled();
  });
});
