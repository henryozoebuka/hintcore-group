import express from 'express';
import { confirmOTP, confirmOTPForPasswordReset, fetchGlobalNotificationsStatus, forgotPassword, login, manageSearchedUsers, manageUsers, showMemberNumber, toggleGlobalNotifications, updateUserProfile, userDashboardData, userGroups, userProfile, userProfileEdit } from '../controllers/userControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';
import { changeGroup } from '../controllers/groupControllers.js';
import { checkPublicToken } from '../middlewares/checkTokenForPublic.js';

const userRouter = express.Router();

userRouter.post('/public/confirm-otp', confirmOTP);
userRouter.post('/public/confirm-otp-for-reset-password', checkPublicToken(), confirmOTPForPasswordReset);
userRouter.post('/public/login', login);
userRouter.post('/public/forgot-password', forgotPassword);
userRouter.get('/private/user-groups', checkPermissionToken(['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions']), userGroups);
userRouter.get('/private/change-group/:id', checkPermissionToken(['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions']), changeGroup);
userRouter.get('/private/user-profile', checkPermissionToken(['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions']), userProfile);
userRouter.get('/private/user-profile-edit', checkPermissionToken(['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions']), userProfileEdit);
userRouter.patch('/private/update-user-profile', checkPermissionToken(['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions']), updateUserProfile);
userRouter.get('/private/fetch-global-notifications-status', checkPermissionToken(['user', 'admin', 'manage_announcements', 'manage_members', 'manage_constitutions']), fetchGlobalNotificationsStatus);
userRouter.patch('/private/toggle-global-notifications', checkPermissionToken(['user', 'admin', 'manage_announcements', 'manage_members', 'manage_constitutions']), toggleGlobalNotifications);

userRouter.post('/private/user-dashboard', checkPermissionToken(['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions']), userDashboardData);
userRouter.get('/private/manage-users', checkPermissionToken(['admin', 'manage_members']), manageUsers);
userRouter.get('/private/manage-searched-users', checkPermissionToken(['admin', 'manage_members']), manageSearchedUsers);
userRouter.get('/private/show-member-number', checkPermissionToken(['admin', 'user', 'manage_members', 'manage_announcements', 'manage_constitutions']), showMemberNumber);

export default userRouter;