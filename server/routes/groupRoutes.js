import express from 'express';
import { createAnotherGroup, createGroup, fetchGroupJoinCode, groupInformation, groupMembers, joinGroup, manageGetGroupInformationUpdate, manageGroupInformation, manageRemoveMember, manageRemoveMembers, manageResetGroupPassword, manageUpdateGroupInformation, toggleGroupNotifications, verifyGroup } from '../controllers/groupControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const groupRouter = express.Router();

groupRouter.post('/public/verify-group', verifyGroup);
groupRouter.post('/public/join-group', joinGroup);
groupRouter.post('/public/create-group', createGroup);
groupRouter.patch('/private/toggle-group-notifications', checkPermissionToken([]), toggleGroupNotifications);
groupRouter.post('/private/create-another-group', checkPermissionToken([]), createAnotherGroup);
groupRouter.get('/private/group-information', checkPermissionToken([]), groupInformation);

// Admin and Group Manager Private Routes
groupRouter.get('/private/manage-get-group-information-for-update', checkPermissionToken(['admin', 'manage_group']), manageGetGroupInformationUpdate);
groupRouter.patch('/private/manage-update-group-information', checkPermissionToken(['admin', 'manage_group']), manageUpdateGroupInformation);
groupRouter.get('/private/manage-get-group-information-for-update', checkPermissionToken(['admin', 'manage_group']), manageGetGroupInformationUpdate);
groupRouter.patch('/private/manage-update-group-information', checkPermissionToken(['admin', 'manage_group']), manageUpdateGroupInformation);
groupRouter.get('/private/fetch-group-join-code', checkPermissionToken(['admin']), fetchGroupJoinCode);
groupRouter.get('/private/group-members', checkPermissionToken(['admin']), groupMembers);
groupRouter.post('/private/manage-remove-member/:id', checkPermissionToken(['admin', 'manage_members']), manageRemoveMember);
groupRouter.post('/private/manage-remove-members/', checkPermissionToken(['admin', 'manage_members']), manageRemoveMembers);
groupRouter.get('/private/manage-group-information/:id', checkPermissionToken(['admin']), manageGroupInformation);
groupRouter.post('/private/manage-reset-group-password', checkPermissionToken(['admin']), manageResetGroupPassword);

export default groupRouter;