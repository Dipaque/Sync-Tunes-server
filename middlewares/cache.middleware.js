import redisClientWrapper from '../redis/index.js'; // Adjust path if needed

export const cacheRoute = async (req, res, next) => {
  const key = req.originalUrl;
  
  try {
    // 1. Await your custom connectClient method to get the ACTUAL redis client
    const client = await redisClientWrapper.connectClient();
    
    // 2. Now you can use .get() on the actual client
    const cachedData = await client.get(key);
    
    if (cachedData) {
      console.log(`[CACHE HIT] ${key}`);
      return res.json(JSON.parse(cachedData)); 
    }
    
    console.log(`[CACHE MISS] ${key}`);
    
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        // 3. Use the actual client for .setEx() as well
        client.setEx(key, 3600, JSON.stringify(body));
      }
      originalJson(body);
    };
    
    next();
  } catch (error) {
    console.error('Redis Cache Error:', error);
    next(); 
  }
};