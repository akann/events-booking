import { Request, Response } from 'express';
import EventModel from '../models/eventModel';

export const createEvent = async (req: Request, res: Response) => {
  const { totalSeats } = req.body;

  if (totalSeats < 10 || totalSeats > 1000) {
    return res
      .status(400)
      .json({ error: 'Total seats must be between 10 and 1000.' });
  }

  try {
    const eventId = await EventModel.create(totalSeats);
    return res.status(201).json({ eventId, totalSeats });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const listAvailableSeats = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  try {
    const availableSeats = await EventModel.getAvailableSeats(eventId);
    return res.json({ availableSeats });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};
