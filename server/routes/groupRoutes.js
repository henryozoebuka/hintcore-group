import express from 'express';
import { createGroup, fetchGroupJoinCode, groupMembers, joinGroup, verifyGroup } from '../controllers/groupControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const groupRouter = express.Router();

groupRouter.post('/public/create-group', createGroup);
groupRouter.get('/private/fetch-group-join-code/:id', checkPermissionToken(['admin']), fetchGroupJoinCode);
groupRouter.get('/private/group-members/:id', checkPermissionToken(['admin']), groupMembers);
groupRouter.post('/public/verify-group', verifyGroup);
groupRouter.post('/public/join-group', joinGroup);

export default groupRouter;