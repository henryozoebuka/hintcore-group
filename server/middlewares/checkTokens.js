import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const checkPermissionToken = (allowedPermissions = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Please login to continue.' });
    }

    jwt.verify(token, process.env.JWT_PASSWORD, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token; Please login again.' });
      }

      const userPermissions = decoded.permissions || [];
      const hasAccess =
        allowedPermissions.length === 0 ||
        allowedPermissions.some(p => userPermissions.includes(p));

      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have access to this action." });
      }

      // Attach decoded info for tenant isolation
      req.user = {
        userId: decoded.userId,
        currentGroupId: decoded.currentGroupId,
        permissions: userPermissions
      };

      next();
    });
  };
};
