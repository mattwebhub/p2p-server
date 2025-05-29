// Client module for Convex
// This file provides a singleton client for Convex operations

let client: any = null;

export function getConvexClient() {
  if (!client) {
    // In a real implementation, this would initialize a Convex client
    // For now, we'll just return whatever is mocked in tests
    client = {};
  }
  return client;
}

export function resetConvexClient() {
  client = null;
}
