import { Request, Response } from 'express';
import EventModel, { Seat } from '../models/eventModel';

const HOLD_EXPIRY = 60000; // 60 seconds
const MAX_HOLD_SEATS = 10; // 10 seats

/**
 * Holds a seat for a user.
 * @param req - The request object.
 * @param res - The response object.
 */
export const holdSeat = async (req: Request, res: Response) => {
  const { eventId, seatId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const event = await EventModel.get(eventId);
    const seat: Seat = event.seats.find((seat) => seat.id === parseInt(seatId));

    if (!seat) {
      return res.status(400).json({ error: 'Seat not found.' });
    }
    if (
      !(
        (seat.holdExpiry && seat.holdExpiry < Date.now()) ||
        seat.status === 'available'
      )
    ) {
      return res
        .status(400)
        .json({ error: 'Only available seats can be held.' });
    }

    const heldSeats = event.seats.filter(
      (seat) => seat.status === 'held' && seat.userId === userId
    );
    if (heldSeats.length >= MAX_HOLD_SEATS) {
      return res.status(400).json({
        error: `You can only hold a maximum of ${MAX_HOLD_SEATS} seats.`,
      });
    }

    seat.status = 'held';
    seat.userId = userId;
    seat.holdExpiry = Date.now() + HOLD_EXPIRY;

    await EventModel.save(event);

    return res.status(200).json({
      seatId: seat.id,
      status: seat.status,
      holdExpiry: seat.holdExpiry,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Reserves a held seat for a user.
 * @param req - The request object.
 * @param res - The response object.
 */
export const reserveSeat = async (req: Request, res: Response) => {
  const { eventId, seatId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const event = await EventModel.get(eventId);
    const seat = event.seats.find((seat) => seat.id === parseInt(seatId));

    if (!seat) {
      return res.status(400).json({ error: 'Seat not found.' });
    }
    if (seat.status !== 'held') {
      return res
        .status(400)
        .json({ error: 'Only held seats can be reserved.' });
    }
    if (seat.userId !== userId) {
      return res.status(400).json({ error: 'You can only reserve your seat.' });
    }

    seat.status = 'reserved';
    seat.holdExpiry = null;

    await EventModel.save(event);

    return res.json({ seatId: seat.id, status: seat.status });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Refreshes the hold expiry time for a held seat.
 * @param req - The request object.
 * @param res - The response object.
 */
export const refreshSeat = async (req: Request, res: Response) => {
  const { eventId, seatId } = req.params;

  try {
    const event = await EventModel.get(eventId);
    const seat = event.seats.find((seat) => seat.id === parseInt(seatId));

    if (!seat) {
      return res.status(400).json({ error: 'Seat not found.' });
    }
    if (seat.status !== 'held') {
      return res
        .status(400)
        .json({ error: 'Only held seats can be refreshed.' });
    }

    seat.holdExpiry = Date.now() + HOLD_EXPIRY;

    await EventModel.save(event);

    return res.json(seat);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
