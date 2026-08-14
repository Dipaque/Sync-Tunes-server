// routes/playlist.js
import express from 'express';
import admin from 'firebase-admin';
import dotenv from "dotenv";

import YTMusic from 'ytmusic-api'; // Replace with your actual import/initialization

// config env
dotenv.config();

// Initialize YT Music
const ytmusic = new YTMusic();
await ytmusic.initialize({
  cookies: process.env.YTMUSIC_COOKIES
});

// 1. Like/Unlike Artist, Album, or Playlist (Passing only ID)
const likeEntity = async (req, res) => {
  try {
    const db = admin.firestore();
    const { userId, id, type, isLiked } = req.body; 

    if (!userId || !id || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const typeLower = type.toLowerCase();
    
    // 1. Clean Dictionary Mapping (Highly scalable for future types)
    const arrayMap = {
      artist: 'likedArtists',
      album: 'likedAlbums',
      playlist: 'likedPlaylists',
      song: 'likedSongs'
    };

    const arrayName = arrayMap[typeLower];
    if (!arrayName) {
      return res.status(400).json({ error: `Invalid entity type: ${type}` });
    }

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    let currentArray = userSnap.data()?.[arrayName] || [];

    if (isLiked) {
      // 2. Prevent duplicate entries before making expensive YT Music calls
      if (currentArray.some(item => item.id === id)) {
        return res.status(200).json({ success: true, message: "Already liked" });
      }

      let entityData = { id, type: type.toUpperCase() };
      
      // 3. Safe Metadata Fetching with Error Handling
      try {
        if (typeLower === 'artist') {
          const data = await ytmusic.getArtist(id);
          entityData = { 
            ...entityData, 
            title: data.name || "Unknown Artist", 
            image: data.thumbnails?.[0]?.url || null, 
            channelName: data.name 
          };
        } else if (typeLower === 'album') {
          const data = await ytmusic.getAlbum(id);
          entityData = { 
            ...entityData, 
            title: data.name || data.title || "Unknown Album", 
            image: data.thumbnails?.[0]?.url || null, 
            channelName: data.name || data.artists?.map(a => a.name).join(', ') || "Unknown" 
          };
        } else if (typeLower === 'playlist') {
          const data = await ytmusic.getPlaylist(id);
          entityData = { 
            ...entityData, 
            title: data.name || data.title || "Unknown Playlist", 
            image: data.thumbnails?.[0]?.url || null 
          };
        } else if (typeLower === 'song') {
          // 🐛 SONG METADATA EXTRACTION
          const data = await ytmusic.getSong(id);
          entityData = {
            ...entityData,
            title: data.name || data.title || data.videoDetails?.title || "Unknown Song",
            image: data.thumbnails?.[0]?.url || data.videoDetails?.thumbnail?.thumbnails?.[0]?.url || null,
            channelName: data.artist?.name || data.author || data.videoDetails?.author || "Unknown Artist",
            artistId: data.artist?.artistId || data.channelId || null
          };
        }
      } catch (ytError) {
        console.error(`Failed to fetch metadata for ${typeLower} ${id}:`, ytError);
        return res.status(502).json({ error: "Failed to fetch entity details from streaming service" });
      }

      currentArray.push({ ...entityData, createdAt: admin.firestore.Timestamp.now() });
    } else {
      // Remove from array
      currentArray = currentArray.filter(item => item.id !== id);
    }

    await userRef.update({ [arrayName]: currentArray });
    res.status(200).json({ success: true, message: `${type} like status updated` });

  } catch (error) {
    console.error("Like Entity Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 2. Get ONLY Liked Songs
const getLikedSongs = async (req, res) => {
  try {
    const { userId } = req.body;
    const userSnap = await admin.firestore().collection('users').doc(userId).get();
    const likedSongs = userSnap.data()?.likedSongs || [];
    res.status(200).json(likedSongs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Full Library (Spotify/YT Music style)
const getLibrary = async (req, res) => {
  try {
    const { userId } = req.body;
    const userSnap = await admin.firestore().collection('users').doc(userId).get();
    const data = userSnap.data() || {};
    
    res.status(200).json({
      likedSongs: data.likedSongs || [],
      likedArtists: data.likedArtists || [],
      likedAlbums: data.likedAlbums || [],
      likedPlaylists: data.likedPlaylists || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { likeEntity, getLikedSongs, getLibrary };