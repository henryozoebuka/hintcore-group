import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const checkPermissionToken = (allowedPermissions) => {
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

            // Check if any allowedPermission is in the user's permissions
            const hasAccess = allowedPermissions.some(p => userPermissions.includes(p));

            if (!hasAccess) {
                return res.status(403).json({ message: "You don't have access to this action." });
            }

            req.user = decoded;
            next();
        });
    };
};