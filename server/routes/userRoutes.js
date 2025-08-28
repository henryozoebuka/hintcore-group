import express from 'express';
import { adminUsers, confirmOTP, login, manageSearchedUsers, updateUserProfile, userDashboardData, userGroups, userProfile } from '../controllers/userControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const userRouter = express.Router();

userRouter.post('/public/confirm-otp', confirmOTP);
userRouter.post('/public/login', login);
userRouter.get('/private/user-groups/:id', checkPermissionToken(['admin', 'manage_announcements', 'manage_constitution', 'user']), userGroups);
userRouter.get('/private/user-profile/:id', checkPermissionToken(['admin', 'user']), userProfile);
userRouter.patch('/private/update-user-profile/:id', checkPermissionToken(['admin', 'user', 'manage_announcements', 'manage_constitution']), updateUserProfile);
userRouter.post('/private/user-dashboard', checkPermissionToken(['admin', 'user']), userDashboardData);
userRouter.get('/private/admin-users/:id', checkPermissionToken(['admin', 'user']), adminUsers);
userRouter.get('/private/manage-searched-users/:id', checkPermissionToken(['admin', 'manage_users']), manageSearchedUsers);

export default userRouter;