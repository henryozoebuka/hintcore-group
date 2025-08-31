import express from 'express';
import { createPayment, manageEditPayment, manageFetchEditPayment, managePayment, managePayments, payments } from '../controllers/paymentControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const paymentRouter = express.Router();

paymentRouter.post('/private/create-payment', checkPermissionToken(['admin',]), createPayment);
paymentRouter.get('/private/manage-payments', checkPermissionToken(['admin', 'manage_payment']), managePayments);
paymentRouter.get('/private/manage-payment/:id', checkPermissionToken(['admin', 'manage_payment']), managePayment);
paymentRouter.get('/private/manage-fetch-edit-payment/:id', checkPermissionToken(['admin', 'manage_payment']), manageFetchEditPayment);
paymentRouter.patch('/private/manage-edit-payment/:id', checkPermissionToken(['admin', 'manage_payment']), manageEditPayment);
paymentRouter.get('/private/payments', checkPermissionToken(['user', 'admin', 'manage_payment']), payments);


export default paymentRouter;