import express from 'express';
import { confirmOTP, confirmOTPForPasswordReset, fetchGlobalNotificationsStatus, forgotPassword, login, manageSearchedMembers, manageMembers, showMemberNumber, toggleGlobalNotifications, userDashboardData, userGroups, profile, manageProfile, manageUsers, manageGetUserGroups, fetchEditProfile, manageFetchEditProfile, updateProfile, manageUpdateProfile } from '../controllers/userControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';
import { changeGroup } from '../controllers/groupControllers.js';
import { checkPublicToken } from '../middlewares/checkTokenForPublic.js';

const userRouter = express.Router();

// Public Routes
userRouter.post('/public/confirm-otp', confirmOTP);
userRouter.post('/public/confirm-otp-for-reset-password', checkPublicToken(), confirmOTPForPasswordReset);
userRouter.post('/public/login', login);
userRouter.post('/public/forgot-password', forgotPassword);

// Private Routes
userRouter.get('/private/user-groups', checkPermissionToken([]), userGroups);
userRouter.get('/private/change-group/:id', checkPermissionToken([]), changeGroup);
userRouter.get('/private/profile', checkPermissionToken([]), profile);
userRouter.get('/private/fetch-edit-profile', checkPermissionToken([]), fetchEditProfile);
userRouter.patch('/private/update-profile', checkPermissionToken([]), updateProfile);
userRouter.get('/private/fetch-global-notifications-status', checkPermissionToken([]), fetchGlobalNotificationsStatus);
userRouter.patch('/private/toggle-global-notifications', checkPermissionToken([]), toggleGlobalNotifications);
userRouter.post('/private/user-dashboard', checkPermissionToken([]), userDashboardData);
userRouter.get('/private/show-member-number', checkPermissionToken([]), showMemberNumber);


// Admin and Group Managers Private Routes
userRouter.get('/private/manage-members', checkPermissionToken(['admin', 'manage_members']), manageMembers);
userRouter.get('/private/manage-searched-members', checkPermissionToken(['admin', 'manage_members']), manageSearchedMembers);


// Global Private Routes
userRouter.get('/private/manage-get-user-groups/:id', checkPermissionToken([], ['super_admin', 'admin']), manageGetUserGroups);
userRouter.get('/private/manage-profile/:id', checkPermissionToken([], ['super_admin', 'admin']), manageProfile);
userRouter.get('/private/manage-users', checkPermissionToken([], ['super_admin', 'admin']), manageUsers);
userRouter.get('/private/manage-fetch-edit-profile', checkPermissionToken([], ['super_admin', 'admin']), manageFetchEditProfile);
userRouter.patch('/private/manage-update-profile/:id', checkPermissionToken([], ['super_admin', 'admin']), manageUpdateProfile);

export default userRouter;