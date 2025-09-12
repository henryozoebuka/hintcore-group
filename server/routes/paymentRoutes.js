import express from 'express';
import { createPayment, getPaymentDetails, manageEditPayment, manageFetchEditPayment, manageGetPaymentMembers, manageMarkPaymentsAsPaid, manageMarkPaymentsAsUnpaid, managePayment, managePayments, manageUpdateContributionPayment, manageUpdateDonationPayment, manageUpdateRequiredPayment, payments } from '../controllers/paymentControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const paymentRouter = express.Router();

paymentRouter.post('/private/create-payment', checkPermissionToken(['admin',]), createPayment);
paymentRouter.get('/private/manage-payments', checkPermissionToken(['admin', 'manage_payment']), managePayments);
paymentRouter.get('/private/payment/:id', checkPermissionToken(['user', 'admin', 'manage_payment']), getPaymentDetails);
paymentRouter.get('/private/manage-payment/:id', checkPermissionToken(['admin', 'manage_payment']), managePayment);
paymentRouter.get('/private/manage-fetch-edit-payment/:id', checkPermissionToken(['admin', 'manage_payment']), manageFetchEditPayment);
paymentRouter.get('/private/manage-get-payment-members/:id', checkPermissionToken(['admin', 'manage_payment']), manageGetPaymentMembers);
paymentRouter.patch('/private/manage-edit-payment/:id', checkPermissionToken(['admin', 'manage_payment']), manageEditPayment);
paymentRouter.post('/private/manage-mark-payments-as-paid', checkPermissionToken(['admin', 'manage_payment']), manageMarkPaymentsAsPaid);
paymentRouter.post('/private/manage-mark-payments-as-unpaid', checkPermissionToken(['admin', 'manage_payment']), manageMarkPaymentsAsUnpaid);
paymentRouter.get('/private/payments', checkPermissionToken(['user', 'admin', 'manage_payment']), payments);

paymentRouter.patch('/private/manage-edit-donation-payment/:id', checkPermissionToken(['admin', 'manage_payment']), manageUpdateDonationPayment);
paymentRouter.patch('/private/manage-edit-required-payment/:id', checkPermissionToken(['admin', 'manage_payment']), manageUpdateRequiredPayment);
paymentRouter.patch('/private/manage-edit-contribution-payment/:id', checkPermissionToken(['admin', 'manage_payment']), manageUpdateContributionPayment);

export default paymentRouter;