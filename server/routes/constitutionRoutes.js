import express from 'express';
import { checkPermissionToken } from '../middlewares/checkTokens.js';
import { constitution, constitutions, createConstitution, deleteConstitution, deleteMultipleConstitutions, manageConstitution, manageConstitutions, manageSearchConstitutions, searchConstitutions, updateConstitution } from '../controllers/constitutionControllers.js';

const constitutionRouter = express.Router();

constitutionRouter.post('/private/create-constitution', checkPermissionToken(['admin', 'manage_constitutions']), createConstitution);
constitutionRouter.get('/private/manage-constitutions', checkPermissionToken(['admin', 'manage_constitutions']), manageConstitutions);
constitutionRouter.get('/private/manage-constitution/:id', checkPermissionToken(['admin', 'manage_constitutions']), manageConstitution);
constitutionRouter.get('/private/constitutions', checkPermissionToken(['user', 'admin', 'manage_constitutions']), constitutions);
constitutionRouter.get('/private/constitution/:id', checkPermissionToken(['user', 'admin']), constitution);
constitutionRouter.get('/private/search-constitutions', checkPermissionToken(['user', 'admin', 'manage_constitutions']), searchConstitutions);
constitutionRouter.get('/private/manage-search-constitutions', checkPermissionToken(['admin', 'manage_constitutions']), manageSearchConstitutions);
constitutionRouter.patch('/private/update-constitution/:id', checkPermissionToken(['admin', 'manage_constitutions']), updateConstitution);


constitutionRouter.post('/private/delete-constitutions', checkPermissionToken(['admin', 'manage_constitutions']), deleteMultipleConstitutions);
constitutionRouter.delete('/private/delete-constitution/:id', checkPermissionToken(['admin', 'manage_constitutions']), deleteConstitution);

export default constitutionRouter;