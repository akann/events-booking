import { v4 as uuidv4 } from 'uuid';
import redisClient from '../redisClient';

interface Seat {
  id: number;
  status: 'available' | 'held' | 'reserved';
  userId?: string | null;
  holdExpiry?: number | null;
}

interface Event {
  id: string;
  seats: Seat[];
  createdAt: Date;
}

class EventModel {
  static async create(totalSeats: number): Promise<string> {
    const eventId = uuidv4();
    const seats = Array.from({ length: totalSeats }, (_, i) => ({
      id: i + 1,
      status: 'available',
    })) as Seat[];

    const event: Event = {
      id: eventId,
      seats,
      createdAt: new Date(),
    };

    await redisClient.set(`event:${eventId}`, JSON.stringify(event));
    return eventId;
  }

  static async get(eventId: string): Promise<Event> {
    const eventData = await redisClient.get(`event:${eventId}`);

    if (!eventData) throw new Error('Event not found');
    return JSON.parse(eventData);
  }

  static async save(event: Event): Promise<void> {
    await redisClient.set(`event:${event.id}`, JSON.stringify(event));
  }

  static async getAvailableSeats(eventId: string): Promise<Seat[]> {
    const event = await this.get(eventId);
    return event.seats.filter(
      (seat) =>
        (seat.holdExpiry && seat.holdExpiry < Date.now()) ||
        seat.status === 'available'
    );
  }
}

export default EventModel;
export { Seat, Event };
