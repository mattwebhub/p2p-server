import { describe, it, expect } from 'vitest';
import { app } from '../src/index';
import request from 'supertest';

describe('Health Check Endpoint', () => {
  it('should return 200 OK with status message', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
