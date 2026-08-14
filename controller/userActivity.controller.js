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
    
    // EXTRACT THE EXTRA DATA FROM REQ.BODY
    const { userId, id, type, isLiked, title, image, channelName, artistId } = req.body; 

    if (!userId || !id || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const typeLower = type.toLowerCase();
    
    const arrayMap = {
      artist: 'likedArtists',
      album: 'likedAlbums',
      playlist: 'likedPlaylists',
      song: 'likedSongs'
    };

    const arrayName = arrayMap[typeLower];
    if (!arrayName) return res.status(400).json({ error: `Invalid type` });

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

    let currentArray = userSnap.data()?.[arrayName] || [];

    if (isLiked) {
      if (currentArray.some(item => item.id === id)) {
        return res.status(200).json({ success: true, message: "Already liked" });
      }

      let entityData = { id, type: type.toUpperCase() };
      
      try {
        if (typeLower === 'artist') {
          const data = await ytmusic.getArtist(id);
          entityData = { ...entityData, title: data.name, image: data.thumbnails?.[0]?.url, channelName: data.name };
        } else if (typeLower === 'album') {
          const data = await ytmusic.getAlbum(id);
          entityData = { ...entityData, title: data.name || data.title, image: data.thumbnails?.[0]?.url, channelName: data.name || data.artists?.map(a => a.name).join(', ') };
        } else if (typeLower === 'playlist') {
          const data = await ytmusic.getPlaylist(id);
          entityData = { ...entityData, title: data.name || data.title, image: data.thumbnails?.[0]?.url };
        } 
        
        else if (typeLower === 'song') {
          // 🐛 FIX: PREFER FRONTEND DATA TO BYPASS GEO-BLOCKS
          entityData = {
            ...entityData,
            title: title || "Unknown Song",
            image: image || null,
            channelName: channelName || "Unknown Artist",
            artistId: artistId || null
          };

          // Only attempt YouTube fetch if the frontend didn't send a title
          if (!title) {
            try {
              const data = await ytmusic.getSong(id);
              entityData.title = data.name || data.videoDetails?.title || "Unknown Song";
              entityData.image = data.thumbnails?.[0]?.url || data.videoDetails?.thumbnail?.thumbnails?.[0]?.url || null;
              entityData.channelName = data.artist?.name || data.author || "Unknown Artist";
              entityData.artistId = data.artist?.artistId || data.channelId || null;
            } catch (ytError) {
              console.warn(`[GEO-BLOCK SAFE] ytmusic.getSong failed for ${id}, falling back to defaults.`);
            }
          }
        }
      } catch (fetchError) {
        console.warn(`Failed to fetch metadata for ${typeLower} ${id}:`, fetchError);
        // Do not crash the API, just save the ID so the user's like is still recorded
      }

      currentArray.push({ ...entityData, createdAt: admin.firestore.Timestamp.now() });
    } else {
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