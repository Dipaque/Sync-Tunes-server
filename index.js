import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import NodeCache from 'node-cache';
import YTMusic from 'ytmusic-api';
import dotenv from "dotenv";

// Import files
import redisClient from './redis/index.js';
import apiRoutes from './router/routes.js';

// config env
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

// Mount all API routes to a global prefix like /api
app.use('/api', apiRoutes);

// 2. Initialize Cache (Stores data for 1 hour to ensure ultra-low latency)
const cache = new NodeCache({ stdTTL: 3600 });

// 3. Initialize YT Music
const ytmusic = new YTMusic();
await ytmusic.initialize();

// Middleware: Verify Firebase Google Auth Token


// --- PROTECTED & CACHED API ROUTES ---



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

const Router = express.Router();

Router.route("/")

// connect redis
redisClient.connectClient();