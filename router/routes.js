import express from "express";

// Import routes
import libraryRoutes from './routes/userActivity.route.js';
import musicRoutes from './routes/music.route.js'

const router = express.Router()
router.use("/library", libraryRoutes)
router.use("/music", musicRoutes)


export default router;
