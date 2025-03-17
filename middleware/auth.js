import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Add user from payload
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;