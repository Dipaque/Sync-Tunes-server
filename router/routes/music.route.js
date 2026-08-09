// routes/musicRoutes.js
import  express from 'express';
const router = express.Router();

// Import Middlewares
import { authenticate } from '../../middlewares/auth.middleware.js';
import { cacheRoute } from '../../middlewares/cache.middleware.js';

// Import Controllers
import {
  searchMusic,
  getArtist,
  getAlbum,
  getUpNext,
  getHome,
  getPlaylist,
  getLyrics
} from '../../controller/music.controller.js';

// Apply middlewares to all routes in this file (cleaner than adding to each line)
router.use(authenticate);
router.use(cacheRoute);

// Define Routes
router.get('/search', searchMusic);
router.get('/artist/:id', getArtist);
router.get('/album/:id', getAlbum);
router.get('/song/:id/up-next', getUpNext);
router.get('/home', getHome);
router.get('/playlist/:id', getPlaylist);
router.get('/lyrics/:id', getLyrics);

export default router;