import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import NodeCache from 'node-cache';
import YTMusic from 'ytmusic-api';
import dotenv from "dotenv";

dotenv.config();

// 1. Initialize Firebase Admin
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

// 2. Initialize Cache (Stores data for 1 hour to ensure ultra-low latency)
const cache = new NodeCache({ stdTTL: 3600 });

// 3. Initialize YT Music
const ytmusic = new YTMusic();
await ytmusic.initialize();

// Middleware: Verify Firebase Google Auth Token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Token is valid, attach user data
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};

// Middleware: Intercept and Cache Responses
const cacheRoute = (req, res, next) => {
  const key = req.originalUrl;
  const cachedData = cache.get(key);
  
  if (cachedData) {
    console.log(`[CACHE HIT] ${key}`);
    return res.json(cachedData);
  }
  
  console.log(`[CACHE MISS] ${key}`);
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only cache successful responses
    if (res.statusCode === 200) cache.set(key, body);
    originalJson(body);
  };
  next();
};

// --- PROTECTED & CACHED API ROUTES ---

// Generic Search (Artists, Songs, Albums)
app.get('/api/search',authenticate, cacheRoute, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    
    const results = await ytmusic.search(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Artist Details
app.get('/api/artist/:id',authenticate, cacheRoute, async (req, res) => {
  try {
    const artist = await ytmusic.getArtist(req.params.id);
    res.json(artist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Album Details
app.get('/api/album/:id',authenticate, cacheRoute, async (req, res) => {
  try {
    const album = await ytmusic.getAlbum(req.params.id);
    res.json(album);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

// Get Song Details / Upcoming tracks
app.get('/api/song/:id/up-next',authenticate, cacheRoute, async (req, res) => {
  try {
    const upcoming = await ytmusic.getUpNexts(req.params.id);
    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Playlist Details
app.get('/api/playlist/:id',authenticate, cacheRoute, async (req, res) => {
    try {
      const playlist = await ytmusic.getPlaylist(req.params.id);
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Lyrics
app.get('/api/lyrics/:id',authenticate, cacheRoute, async (req, res) => {
    try {
      const lyrics = await ytmusic.getLyrics(req.params.id);
      res.json(lyrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});