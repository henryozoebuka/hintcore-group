import express from 'express';
import { createPayment, getPaymentDetails, manageDeletePayment, manageDeletePayments, manageEditPayment, manageFetchEditPayment, manageGetPaymentMembers, manageMarkPaymentsAsPaid, manageMarkPaymentsAsUnpaid, managePayment, managePaymentReport, managePayments, manageSearchPaymentReports, manageSearchPayments, manageUpdateContributionPayment, manageUpdateDonationPayment, manageUpdateRequiredPayment, payments } from '../controllers/paymentControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const paymentRouter = express.Router();

paymentRouter.post('/private/create-payment', checkPermissionToken(['admin', 'manage_payments']), createPayment);
paymentRouter.get('/private/manage-payments', checkPermissionToken(['admin', 'manage_payments']), managePayments);
paymentRouter.get('/private/manage-search-payments', checkPermissionToken(['admin', 'manage_payments']), manageSearchPayments);
paymentRouter.get('/private/payment/:id', checkPermissionToken(['user', 'admin', 'manage_payments']), getPaymentDetails);
paymentRouter.get('/private/manage-payment/:id', checkPermissionToken(['admin', 'manage_payments']), managePayment);
paymentRouter.get('/private/manage-fetch-edit-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageFetchEditPayment);
paymentRouter.get('/private/manage-get-payment-members/:id', checkPermissionToken(['admin', 'manage_payments']), manageGetPaymentMembers);
paymentRouter.patch('/private/manage-edit-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageEditPayment);
paymentRouter.post('/private/manage-mark-payments-as-paid', checkPermissionToken(['admin', 'manage_payments']), manageMarkPaymentsAsPaid);
paymentRouter.post('/private/manage-mark-payments-as-unpaid', checkPermissionToken(['admin', 'manage_payments']), manageMarkPaymentsAsUnpaid);
paymentRouter.get('/private/payments', checkPermissionToken(['user', 'admin', 'manage_payments']), payments);

paymentRouter.patch('/private/manage-edit-donation-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageUpdateDonationPayment);
paymentRouter.patch('/private/manage-edit-required-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageUpdateRequiredPayment);
paymentRouter.patch('/private/manage-edit-contribution-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageUpdateContributionPayment);

paymentRouter.delete('/private/manage-delete-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageDeletePayment);
paymentRouter.post('/private/manage-delete-payments', checkPermissionToken(['admin', 'manage_payments']), manageDeletePayments);

paymentRouter.get('/private/manage-search-payment-reports', checkPermissionToken(['admin', 'manage_accounts']), manageSearchPaymentReports);
paymentRouter.get('/private/manage-payment-report/:id', checkPermissionToken(['admin', 'manage_accounts']), managePaymentReport);

export default paymentRouter;