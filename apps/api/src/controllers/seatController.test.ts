import request from 'supertest';

import app from '../main';
import redisClient from '../redisClient';

describe('Seat Endpoint', () => {
  afterEach(async () => {
    await redisClient.flushdb();
  });

  describe('Hold Seat', () => {
    it('✅ should hold a seat for a user', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      const holdSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      expect(holdSeatRes.statusCode).toEqual(200);
      expect(holdSeatRes.body).toHaveProperty('seatId', seatId);
      expect(holdSeatRes.body).toHaveProperty('status', 'held');
      expect(holdSeatRes.body).toHaveProperty('holdExpiry');
    });

    it('should not hold a seat if user ID is missing', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      const holdSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({});

      expect(holdSeatRes.statusCode).toEqual(400);
      expect(holdSeatRes.body).toHaveProperty('error', 'User ID is required.');
    });

    it('should not hold a seat if seat is already held', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      const res = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('held');

      const holdSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '456' });

      expect(holdSeatRes.statusCode).toEqual(400);
      expect(holdSeatRes.body).toHaveProperty(
        'error',
        'Only available seats can be held.'
      );
    });

    it('✅ should hold a seat if seat is already held but time elapse', async () => {
      jest.useFakeTimers();
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;

      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      const res = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('held');
      jest.advanceTimersByTime(10000);
      expect(res.body.holdExpiry).toBeLessThan(Date.now() + 60000);

      jest.advanceTimersByTime(71000);

      const holdSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '456' });

      expect(holdSeatRes.statusCode).toEqual(200);
      expect(holdSeatRes.body.status).toEqual('held');
      expect(holdSeatRes.body.userId).toEqual(undefined);

      jest.useRealTimers();
    });

    it('should throw "seat not found error" if seat not found', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 11,
      });

      const eventId = createEventRes.body.eventId;

      const holdSeatRes = await request(app)
        .post(`/events/${eventId}/seats/100/hold`)
        .send({ userId: '123' });

      expect(holdSeatRes.statusCode).toEqual(400);
      expect(holdSeatRes.body).toHaveProperty('error', 'Seat not found.');
    });

    it('✅ should throw "max hold seats error" if user tries to hold more than 10 seats', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seats = listSeatsRes.body.availableSeats.slice(0, 11);

      for (const seat of seats) {
        await request(app)
          .post(`/events/${eventId}/seats/${seat.id}/hold`)
          .send({ userId: '123' });
      }

      const holdSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seats[10].id}/hold`)
        .send({ userId: '123' });

      expect(holdSeatRes.statusCode).toEqual(400);
      expect(holdSeatRes.body).toHaveProperty(
        'error',
        'You can only hold a maximum of 10 seats.'
      );
    });

    it('should fail to create a new event on redis error', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      const get = redisClient.get;
      redisClient.get = jest
        .fn()
        .mockRejectedValue(new Error('Redis connnection error'));

      const holdSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      expect(holdSeatRes.statusCode).toEqual(500);
      expect(holdSeatRes.body).toHaveProperty(
        'error',
        'Redis connnection error'
      );

      redisClient.get = get;
    });
  });

  describe('Reserve Seat', () => {
    it('✅ should reserve a held seat for a user', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      const reserveSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId: '123' });

      expect(reserveSeatRes.statusCode).toEqual(200);
      expect(reserveSeatRes.body).toHaveProperty('seatId', seatId);
      expect(reserveSeatRes.body).toHaveProperty('status', 'reserved');
    });

    it('should not reserve a seat if user ID is missing', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      const reserveSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/reserve`)
        .send({});

      expect(reserveSeatRes.statusCode).toEqual(400);
      expect(reserveSeatRes.body).toHaveProperty(
        'error',
        'User ID is required.'
      );
    });

    it('should not reserve a seat if seat is not held', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seat = listSeatsRes.body.availableSeats[1];

      expect(seat.id).toEqual(2);
      expect(seat.status).not.toEqual('held');

      const reserveSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seat.id}/reserve`)
        .send({ userId: '123' });

      expect(reserveSeatRes.statusCode).toEqual(400);
      expect(reserveSeatRes.body).toHaveProperty(
        'error',
        'Only held seats can be reserved.'
      );
    });

    it('✅ should throw error user is different', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;

      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);

      const seatId = listSeatsRes.body.availableSeats[0].id;

      await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      const reserveSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId: '456' });

      expect(reserveSeatRes.statusCode).toEqual(400);
      expect(reserveSeatRes.body).toHaveProperty(
        'error',
        'You can only reserve your seat.'
      );
    });

    it('should throw "seat not found error" if seat not found', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 11,
      });

      const eventId = createEventRes.body.eventId;

      await request(app)
        .post(`/events/${eventId}/seats/11/hold`)
        .send({ userId: '123' });

      const reserveSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${111}/reserve`)
        .send({ userId: '123' });

      expect(reserveSeatRes.statusCode).toEqual(400);
      expect(reserveSeatRes.body).toHaveProperty('error', 'Seat not found.');
    });

    it('should fail on redis error', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      const get = redisClient.get;
      redisClient.get = jest
        .fn()
        .mockRejectedValue(new Error('Redis connnection error'));

      const reserveSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId: '123' });

      expect(reserveSeatRes.statusCode).toEqual(500);
      expect(reserveSeatRes.body).toHaveProperty(
        'error',
        'Redis connnection error'
      );

      redisClient.get = get;
    });
  });

  describe('Refresh Seat', () => {
    it('✅ should refresh the hold expiry time for a held seat', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;

      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);

      const seatId = listSeatsRes.body.availableSeats[0].id;

      await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      const refreshSeatRes = await request(app).post(
        `/events/${eventId}/seats/${seatId}/refresh`
      );

      expect(refreshSeatRes.statusCode).toEqual(200);
      expect(refreshSeatRes.body).toHaveProperty('id', seatId);
      expect(refreshSeatRes.body).toHaveProperty('status', 'held');
      expect(refreshSeatRes.body).toHaveProperty('holdExpiry');
    });

    it('should not refresh the hold expiry time for a reserved seat', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;

      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);

      const seatId = listSeatsRes.body.availableSeats[0].id;

      await request(app)
        .post(`/events/${eventId}/seats/${seatId}/hold`)
        .send({ userId: '123' });

      await request(app)
        .post(`/events/${eventId}/seats/${seatId}/reserve`)
        .send({ userId: '123' });

      const refreshSeatRes = await request(app).post(
        `/events/${eventId}/seats/${seatId}/refresh`
      );

      expect(refreshSeatRes.statusCode).toEqual(400);
      expect(refreshSeatRes.body).toHaveProperty(
        'error',
        'Only held seats can be refreshed.'
      );
    });

    it('should not refresh the hold expiry time for a seat that is not held', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;

      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);

      const seat = listSeatsRes.body.availableSeats[1];

      expect(seat.id).toEqual(2);
      expect(seat.status).not.toEqual('held');

      const refreshSeatRes = await request(app).post(
        `/events/${eventId}/seats/${seat.id}/refresh`
      );

      expect(refreshSeatRes.statusCode).toEqual(400);
      expect(refreshSeatRes.body).toHaveProperty(
        'error',
        'Only held seats can be refreshed.'
      );
    });

    it('should throw "seat not found error" if seat not found', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 11,
      });

      const eventId = createEventRes.body.eventId;

      const refreshSeatRes = await request(app)
        .post(`/events/${eventId}/seats/100/refresh`)
        .send({ userId: '123' });

      expect(refreshSeatRes.statusCode).toEqual(400);
      expect(refreshSeatRes.body).toHaveProperty('error', 'Seat not found.');
    });

    it('should fail on redis error', async () => {
      const createEventRes = await request(app).post('/events').send({
        totalSeats: 100,
      });

      const eventId = createEventRes.body.eventId;
      const listSeatsRes = await request(app).get(`/events/${eventId}/seats`);
      const seatId = listSeatsRes.body.availableSeats[0].id;

      const get = redisClient.get;
      redisClient.get = jest
        .fn()
        .mockRejectedValue(new Error('Redis connnection error'));

      const refreshSeatRes = await request(app)
        .post(`/events/${eventId}/seats/${seatId}/refresh`)
        .send({ userId: '123' });

      expect(refreshSeatRes.statusCode).toEqual(500);
      expect(refreshSeatRes.body).toHaveProperty(
        'error',
        'Redis connnection error'
      );

      redisClient.get = get;
    });
  });
});
