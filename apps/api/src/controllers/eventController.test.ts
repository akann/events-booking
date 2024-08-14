import request from 'supertest';

import app from '../main';
import redisClient from '../redisClient';

describe('Event Endpoint', () => {
  afterEach(async () => {
    await redisClient.flushdb();
  });
  describe('Create Event', () => {
    it('✅ should create a new event', async () => {
      const res = await request(app).post('/events').send({
        totalSeats: 100,
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('eventId');
      expect(res.body).toHaveProperty('totalSeats', 100);
    });

    it('✅ should not create an event with less than 10 seats', async () => {
      const res = await request(app).post('/events').send({
        totalSeats: 5,
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty(
        'error',
        'Total seats must be between 10 and 1000.'
      );
    });

    it('✅ should not create an event with more than 1000 seats', async () => {
      const res = await request(app).post('/events').send({
        totalSeats: 1001,
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty(
        'error',
        'Total seats must be between 10 and 1000.'
      );
    });

    it('should fail to create a new event on redis error', async () => {
      const set = redisClient.set;
      redisClient.set = jest
        .fn()
        .mockRejectedValue(new Error('Redis connnection error'));

      const res = await request(app).post('/events').send({
        totalSeats: 100,
      });

      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error', 'Redis connnection error');

      redisClient.set = set;
    });
  });

  describe('List Available Seats', () => {
    it('✅ should list available seats for an event not in "hold"', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;

      const res = await request(app).get(`/events/${eventId}/seats`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('availableSeats');
      expect(res.body.availableSeats).toHaveLength(100);
    });

    it('should return 404 if event does not exist', async () => {
      const res = await request(app).get('/events/1/seats');

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Event not found');
    });
  });
});
