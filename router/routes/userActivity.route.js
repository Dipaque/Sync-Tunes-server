import express from "express"
import { likeEntity, getLikedSongs, getLibrary } from "../../controller/userActivity.controller.js";
import { getMyRooms } from "../../controller/jam.controller.js";

const router = express.Router();

// Library Routes
router.post('/like-entity', likeEntity);
router.post('/songs', getLikedSongs);
router.post('/all', getLibrary);

// Rooms Route
router.post('/my-rooms', getMyRooms);

export default router;

