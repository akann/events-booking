import { Router } from 'express';
import {
  holdSeat,
  refreshSeat,
  reserveSeat,
} from '../controllers/seatController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Seats
 *   description: API for managing seat reservations
 */

/**
 * @swagger
 * /events/{eventId}/seats/{seatId}/hold:
 *   post:
 *     summary: Hold a seat
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event ID
 *       - in: path
 *         name: seatId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The seat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "f62217ed-2a6a-4e37-a608-5a35b308b8dc"
 *     responses:
 *       200:
 *         description: Seat held successfully
 *       400:
 *         description: Seat not available for holding
 *       404:
 *         description: Event not found
 */
router.post('/:eventId/seats/:seatId/hold', holdSeat);

/**
 * @swagger
 * /events/{eventId}/seats/{seatId}/reserve:
 *   post:
 *     summary: Reserve a seat
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event ID
 *       - in: path
 *         name: seatId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The seat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "f62217ed-2a6a-4e37-a608-5a35b308b8dc"
 *     responses:
 *       200:
 *         description: Seat reserved successfully
 *       400:
 *         description: Seat cannot be reserved
 *       404:
 *         description: Event not found
 */
router.post('/:eventId/seats/:seatId/reserve', reserveSeat);

/**
 * @swagger
 * /events/{eventId}/seats/{seatId}/refresh:
 *   post:
 *     summary: Refresh a held seat
 *     tags: [Seats]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: The event ID
 *       - in: path
 *         name: seatId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The seat ID
 *     responses:
 *       200:
 *         description: Seat refreshed successfully
 *       400:
 *         description: Seat cannot be refreshed
 *       404:
 *         description: Event not found
 */
router.post('/:eventId/seats/:seatId/refresh', refreshSeat);

export default router;
