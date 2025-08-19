import express from 'express';
import { adminSearchedUsers, adminUsers, confirmOTP, login, userDashboard, userProfile } from '../controllers/userControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const userRouter = express.Router();

userRouter.post('/public/confirm-otp', confirmOTP);
userRouter.post('/public/login', login);
userRouter.get('/private/user-profile/:id', checkPermissionToken(['admin', 'user']), userProfile);
userRouter.get('/private/user-dashboard/:id', checkPermissionToken(['admin', 'user']), userDashboard);
userRouter.get('/private/admin-users/:id', checkPermissionToken(['admin', 'user']), adminUsers);
userRouter.get('/private/admin-searched-users/:id', checkPermissionToken(['admin']), adminSearchedUsers);

export default userRouter;