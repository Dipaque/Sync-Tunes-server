// routes/playlist.js
import express from 'express';
import admin from 'firebase-admin';

import YTMusic from 'ytmusic-api'; // Replace with your actual import/initialization

// Initialize YT Music
const ytmusic = new YTMusic();
await ytmusic.initialize();

// 1. Like/Unlike Artist, Album, or Playlist (Passing only ID)
const likeEntity = async (req, res) => {
  try {
    const db = admin.firestore();
    const { userId, id, type, isLiked } = req.body; 
    // type should be 'artist', 'album', or 'playlist'

    if (!userId || !id || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    // Determine which array to update based on type
    const arrayName = type === 'artist' ? 'likedArtists' : 
                      type === 'album' ? 'likedAlbums' : 'likedPlaylists';
                      
    let currentArray = userSnap.data()?.[arrayName] || [];

    if (isLiked) {
      // Fetch metadata from YouTube Music before saving
      let entityData = { id, type: type.toUpperCase() };
      
      if (type === 'artist') {
        const data = await ytmusic.getArtist(id);
        entityData = { 
          ...entityData, 
          title: data.name || "Unknown Artist", 
          image: data.thumbnails?.[0]?.url || null, 
          channelName: data.name
        };
      } else if (type === 'album') {
        const data = await ytmusic.getAlbum(id);
        entityData = { 
          ...entityData, 
          title: data.name || data.title || "Unknown Album", 
          image: data.thumbnails?.[0]?.url || null, 
          channelName: data.name || data.artists?.map(a => a.name).join(', ') || "Unknown" 
        };
      } else if (type === 'playlist') {
        const data = await ytmusic.getPlaylist(id);
        entityData = { 
          ...entityData, 
          title: data.name || data.title || "Unknown Playlist", 
          image: data.thumbnails?.[0]?.url || null 
        };
      }

      // Add if not exists
      if (!currentArray.some(item => item.id === id)) {
        currentArray.push({ ...entityData, createdAt: admin.firestore.Timestamp.now() });
      }
    } else {
      // Remove from array
      currentArray = currentArray.filter(item => item.id !== id);
    }

    await userRef.update({ [arrayName]: currentArray });
    res.status(200).json({ success: true, message: `${type} like status updated` });

  } catch (error) {
    console.error("Like Entity Error:", error);
    res.status(500).json({ error: error.message });
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