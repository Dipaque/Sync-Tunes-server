// controllers/musicController.js
import YTMusic from 'ytmusic-api'; // Replace with your actual import/initialization

// 3. Initialize YT Music
const ytmusic = new YTMusic();
await ytmusic.initialize({
  cookies: process.env.YTMUSIC_COOKIES
});

const searchMusic = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    
    const results = await ytmusic.search(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSongInfo = async (req, res) => {
    try{
        const song = await ytmusic.getSong(req.params.id)
        res.json(song)
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

const getArtist = async (req, res) => {
  try {
    const artist = await ytmusic.getArtist(req.params.id);
    res.json(artist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAlbum = async (req, res) => {
  try {
    const album = await ytmusic.getAlbum(req.params.id);
    res.json(album);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const getUpNext = async (req, res) => {
  try {
    const upcoming = await ytmusic.getUpNexts(req.params.id);
    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// controllers/musicController.js
// Make sure you have ytmusic initialized in this file

const getHome = async (req, res) => {
    try {
      const { lang } = req.query;
      
      // Default to "Global" or "Trending" if no language is provided
      const languageQuery = lang && lang !== "English" ? lang : "Trending Hits";
  
      // 1. Execute parallel searches tailored to the language preference
      const [songResults, albumResults, playlistResults] = await Promise.all([
        ytmusic.search(`${languageQuery} latest songs`),
        ytmusic.search(`${languageQuery} top albums`),
        ytmusic.search(`Best ${languageQuery} playlists`)
      ]);
  
      // 2. Safe mapping functions to strictly enforce your Zod Schema
  
      const mapSong = (item) => ({
        type: "SONG",
        videoId: item.videoId || "",
        name: item.name || item.title || "Unknown Song",
        artist: {
          artistId: item.artist?.artistId || item.artists?.[0]?.artistId || null,
          name: item.artist?.name || item.artists?.[0]?.name || "Unknown Artist"
        },
        album: item.album ? {
          albumId: item.album.albumId || "",
          name: item.album.name || "Unknown Album"
        } : null,
        duration: item.duration || null, // ytmusic usually returns seconds
        thumbnails: item.thumbnails || []
      });
  
      const mapAlbum = (item) => ({
        type: "ALBUM",
        albumId: item.albumId || item.browseId || "",
        playlistId: item.playlistId || item.albumId || "", 
        name: item.name || item.title || "Unknown Album",
        artist: {
          artistId: item.artist?.artistId || item.artists?.[0]?.artistId || null,
          name: item.artist?.name || item.artists?.[0]?.name || "Unknown Artist"
        },
        year: parseInt(item.year, 10) || null,
        thumbnails: item.thumbnails || []
      });
  
      const mapPlaylist = (item) => ({
        type: "PLAYLIST",
        playlistId: item.playlistId || item.browseId || "",
        name: item.name || item.title || "Unknown Playlist",
        artist: {
          artistId: item.author?.channelId || item.artist?.artistId || null,
          name: item.author?.name || item.artist?.name || "YouTube Music"
        },
        thumbnails: item.thumbnails || []
      });
  
      // 3. Filter the mixed search results by actual type and apply mappings
      
      const trendingSongs = songResults
        .filter(item => item.type === "SONG" || item.type === "VIDEO")
        .map(mapSong)
        .slice(0, 15); // Keep payload sizes reasonable
  
      const topAlbums = albumResults
        .filter(item => item.type === "ALBUM")
        .map(mapAlbum)
        .slice(0, 15);
  
      const popularPlaylists = playlistResults
        .filter(item => item.type === "PLAYLIST")
        .map(mapPlaylist)
        .slice(0, 15);
  
      // 4. Construct the final HomeSection[] array matching your Zod Schema exactly
      
      const homeSections = [];
  
      if (trendingSongs.length > 0) {
        homeSections.push({
          title: `Trending in ${languageQuery}`,
          contents: trendingSongs
        });
      }
  
      if (topAlbums.length > 0) {
        homeSections.push({
          title: `Top ${languageQuery} Albums`,
          contents: topAlbums
        });
      }
  
      if (popularPlaylists.length > 0) {
        homeSections.push({
          title: `Popular ${languageQuery} Playlists`,
          contents: popularPlaylists
        });
      }
  
      // 5. Return the strictly typed array
      res.json(homeSections);
  
    } catch (error) {
      console.error("Home API Error:", error);
      res.status(500).json({ error: error.message });
    }
  };

const getPlaylist = async (req, res) => {
  try {
    const playlist = await ytmusic.getPlaylist(req.params.id);
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLyrics = async (req, res) => {
  try {
    const lyrics = await ytmusic.getLyrics(req.params.id);
    res.json(lyrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export  {
  searchMusic,
  getArtist,
  getAlbum,
  getUpNext,
  getHome,
  getPlaylist,
  getLyrics,
  getSongInfo
};