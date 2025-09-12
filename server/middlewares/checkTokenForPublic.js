import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const checkPublicToken = () => {

  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_PASSWORD, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token. Please request a new OTP.' });
      }

      // Attach user ID to request for downstream usage
      req.user = {
        userId: decoded.userId
      };

      next();
    });
  };
};
