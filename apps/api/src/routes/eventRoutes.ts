import { Router } from 'express';
import {
  createEvent,
  listAvailableSeats,
} from '../controllers/eventController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: API for managing events and seats
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalSeats:
 *                 type: integer
 *                 example: 11
 *     responses:
 *       201:
 *         description: The event was successfully created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 *
 */
router.post('/', createEvent);

/**
 * @swagger
 * /events/{eventId}/seats:
 *   get:
 *     summary: Get a list of available seats for an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         description: Event ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of available seats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availableSeats:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [1, 2, 3]
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/seats', listAvailableSeats);

export default router;
