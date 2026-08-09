// middlewares/authMiddleware.js
import admin from 'firebase-admin';

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

export { authenticate };