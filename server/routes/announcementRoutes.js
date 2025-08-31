import express from 'express';
import { checkPermissionToken } from '../middlewares/checkTokens.js';
import { announcement, announcements, createAnnouncement, deleteAnnouncement, deleteMultipleAnnouncements, manageAnnouncement, manageAnnouncements, manageSearchAnnouncements, searchAnnouncements, updateAnnouncement } from '../controllers/announcementControllers.js';

const announcementRouter = express.Router();

announcementRouter.post('/private/create-announcement', checkPermissionToken(['admin', 'manage_announcements']), createAnnouncement);
announcementRouter.get('/private/manage-announcements', checkPermissionToken(['admin', 'manage_announcements']), manageAnnouncements);
announcementRouter.get('/private/manage-announcement/:id', checkPermissionToken(['admin', 'manage_announcements']), manageAnnouncement);
announcementRouter.get('/private/announcements', checkPermissionToken(['user', 'admin', 'manage_announcements']), announcements);
announcementRouter.get('/private/announcement/:id', checkPermissionToken(['user', 'admin']), announcement);
announcementRouter.get('/private/search-announcements', checkPermissionToken(['user', 'admin', 'manage_announcements']), searchAnnouncements);
announcementRouter.get('/private/manage-search-announcements', checkPermissionToken(['admin', 'manage_announcements']), manageSearchAnnouncements);
announcementRouter.patch('/private/update-announcement/:id', checkPermissionToken(['admin', 'manage_announcements']), updateAnnouncement);


announcementRouter.post('/private/delete-announcements', checkPermissionToken(['admin', 'manage_announcements']), deleteMultipleAnnouncements);
announcementRouter.delete('/private/delete-announcement/:id', checkPermissionToken(['admin', 'manage_announcements']), deleteAnnouncement);

export default announcementRouter;