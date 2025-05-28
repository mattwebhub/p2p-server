import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../src/index';
import request from 'supertest';
import { roomService } from '../src/rooms/service';

describe('Rooms API Endpoints', () => {
  // Reset rooms before each test
  beforeEach(() => {
    // Clear all rooms using the exposed method
    roomService.clearAllRooms();
  });

  describe('POST /rooms', () => {
    it('should create a new room', async () => {
      const response = await request(app)
        .post('/rooms')
        .send({ hostUid: 'user123' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('roomId');
      expect(response.body.hostUid).toBe('user123');
      expect(response.body.status).toBe('waiting');
      expect(response.body.players).toContain('user123');
      expect(response.body.created).toBeTypeOf('number');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/rooms')
        .send({}) // Missing hostUid
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /rooms', () => {
    it('should return an empty array when no rooms exist', async () => {
      const response = await request(app)
        .get('/rooms')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return all rooms', async () => {
      // Create a room first
      await request(app)
        .post('/rooms')
        .send({ hostUid: 'user123' })
        .set('Accept', 'application/json');

      const response = await request(app)
        .get('/rooms')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].hostUid).toBe('user123');
    });
  });

  describe('GET /rooms/:roomId', () => {
    it('should return a room by ID', async () => {
      // Create a room first
      const createResponse = await request(app)
        .post('/rooms')
        .send({ hostUid: 'user123' })
        .set('Accept', 'application/json');

      const roomId = createResponse.body.roomId;

      const response = await request(app)
        .get(`/rooms/${roomId}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.roomId).toBe(roomId);
      expect(response.body.hostUid).toBe('user123');
    });

    it('should return 404 for non-existent room', async () => {
      const response = await request(app)
        .get('/rooms/nonexistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
