import express from 'express';
import { createPayment, managePayments } from '../controllers/paymentControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const paymentRouter = express.Router();

paymentRouter.post('/private/create-payment', checkPermissionToken(['admin',]), createPayment);
paymentRouter.get('/private/manage-payments/:id', checkPermissionToken(['admin', 'manage_payment']), managePayments);


export default paymentRouter;