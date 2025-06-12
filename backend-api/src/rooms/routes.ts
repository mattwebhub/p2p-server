import { Router } from 'express';
import { roomController } from './controller';
import { validateRequest } from '../shared/middleware/validation';
import { CreateRoomSchema, GetRoomsQuerySchema, RoomIdSchema } from './schema';

const router = Router();

// POST /rooms - Create a new room
router.post('/', 
  validateRequest(CreateRoomSchema, 'body'),
  roomController.createRoom.bind(roomController)
);

// GET /rooms - Get all rooms
router.get('/', 
  validateRequest(GetRoomsQuerySchema, 'query'),
  roomController.getAllRooms.bind(roomController)
);

// GET /rooms/:roomId - Get a room by ID
// router.get("/:roomId", 
//   (req, res, next) => {
//     // Custom middleware to validate URL parameter
//     const parseResult = RoomIdSchema.safeParse(req.params.roomId);
//     if (!parseResult.success) {
//       res.status(400).json({
//         error: "Invalid room ID format",
//         details: parseResult.error
//       });
//       return;
//     }
//     req.params.roomId = parseResult.data;
//     next();
//   },
//   roomController.getRoomById.bind(roomController)
// );

export const roomsRouter = router;
