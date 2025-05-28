import { Router } from 'express';
import { roomController } from './controller';

const router = Router();

// POST /rooms - Create a new room
router.post('/', roomController.createRoom.bind(roomController));

// GET /rooms - Get all rooms
router.get('/', roomController.getAllRooms.bind(roomController));

// GET /rooms/:roomId - Get a room by ID
router.get('/:roomId', roomController.getRoomById.bind(roomController));

export const roomsRouter = router;
