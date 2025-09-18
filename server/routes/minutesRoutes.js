import express from 'express';
import { checkPermissionToken } from '../middlewares/checkTokens.js';
import { minutes, minutesRecords, createMinutes, deleteMinutes, deleteMinutesRecords, manageMinutes, manageMinutesRecords, manageSearchMinutesRecords, searchMinutesRecords, updateMinutes } from '../controllers/minutesControllers.js';

const minutesRouter = express.Router();

minutesRouter.get('/private/minutes-records', checkPermissionToken(['user', 'admin', 'manage_minutes_records']), minutesRecords);
minutesRouter.get('/private/minutes/:id', checkPermissionToken(['user', 'admin']), minutes);
minutesRouter.get('/private/search-minutes-records', checkPermissionToken(['user', 'admin', 'manage_minutes_records']), searchMinutesRecords);

// Admin and Group Manager Private Routes
minutesRouter.post('/private/create-minutes', checkPermissionToken(['admin', 'manage_minutes_records']), createMinutes);
minutesRouter.get('/private/manage-minutes-records', checkPermissionToken(['admin', 'manage_minutes_records']), manageMinutesRecords);
minutesRouter.get('/private/manage-minutes/:id', checkPermissionToken(['admin', 'manage_minutes_records']), manageMinutes);
minutesRouter.get('/private/manage-search-minutes-records', checkPermissionToken(['admin', 'manage_minutes_records']), manageSearchMinutesRecords);
minutesRouter.patch('/private/update-minutes/:id', checkPermissionToken(['admin', 'manage_minutes_records']), updateMinutes);
minutesRouter.post('/private/delete-minutes-records', checkPermissionToken(['admin', 'manage_minutes_records']), deleteMinutesRecords);
minutesRouter.delete('/private/delete-minutes/:id', checkPermissionToken(['admin', 'manage_minutes_records']), deleteMinutes);


export default minutesRouter;