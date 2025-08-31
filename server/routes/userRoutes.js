import express from 'express';
import { confirmOTP, login, manageSearchedUsers, manageUsers, updateUserProfile, userDashboardData, userGroups, userProfile, userProfileEdit } from '../controllers/userControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const userRouter = express.Router();

userRouter.post('/public/confirm-otp', confirmOTP);
userRouter.post('/public/login', login);
userRouter.get('/private/user-groups', checkPermissionToken(['admin', 'manage_announcements', 'manage_constitution', 'user']), userGroups);
userRouter.get('/private/user-profile', checkPermissionToken(['admin', 'user']), userProfile);
userRouter.get('/private/user-profile-edit', checkPermissionToken(['admin', 'user']), userProfileEdit);
userRouter.patch('/private/update-user-profile', checkPermissionToken(['admin', 'user', 'manage_announcements', 'manage_constitution']), updateUserProfile);
userRouter.post('/private/user-dashboard', checkPermissionToken(['admin', 'user']), userDashboardData);
userRouter.get('/private/manage-users', checkPermissionToken(['admin', 'user']), manageUsers);
userRouter.get('/private/manage-searched-users', checkPermissionToken(['admin', 'manage_users']), manageSearchedUsers);

export default userRouter;