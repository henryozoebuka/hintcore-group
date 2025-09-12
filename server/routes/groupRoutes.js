import express from 'express';
import { createAnotherGroup, createGroup, fetchGroupJoinCode, groupInformation, groupMembers, joinGroup, manageGetGroupInformationUpdate, manageRemoveMember, manageRemoveMembers, manageUpdateGroupInformation, toggleGroupNotifications, verifyGroup } from '../controllers/groupControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const groupRouter = express.Router();

groupRouter.post('/public/verify-group', verifyGroup);
groupRouter.post('/public/join-group', joinGroup);
groupRouter.post('/public/create-group', createGroup);
groupRouter.patch('/private/toggle-group-notifications', checkPermissionToken(['user', 'admin', 'manage_announcements', 'manage_members', 'manage_constitutions']), toggleGroupNotifications);

groupRouter.post('/private/create-another-group', checkPermissionToken(['user', 'admin', 'manage_announcements', 'manage_members', 'manage_constitutions']), createAnotherGroup);
groupRouter.get('/private/manage-get-group-information-for-update', checkPermissionToken(['admin', 'manage_group']), manageGetGroupInformationUpdate);
groupRouter.patch('/private/manage-update-group-information', checkPermissionToken(['admin', 'manage_group']), manageUpdateGroupInformation);

groupRouter.get('/private/group-information', checkPermissionToken(['user', 'admin', 'manage_announcements', 'manage_members', 'manage_constitutions']), groupInformation);
groupRouter.get('/private/fetch-group-join-code', checkPermissionToken(['admin']), fetchGroupJoinCode);
groupRouter.get('/private/group-members', checkPermissionToken(['admin']), groupMembers);
groupRouter.post('/private/manage-remove-member/:id', checkPermissionToken(['admin', 'manage_members']), manageRemoveMember);
groupRouter.post('/private/manage-remove-members/', checkPermissionToken(['admin', 'manage_members']), manageRemoveMembers);

export default groupRouter;