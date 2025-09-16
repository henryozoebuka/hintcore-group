import express from 'express';
import { createExpense, manageDeleteExpense, manageDeleteExpenses, manageExpense, manageExpenses, manageFetchEditExpense, manageSearchExpenseReports, manageSearchExpenses, manageUpdateExpense} from '../controllers/expenseControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const expenseRouter = express.Router();

expenseRouter.post('/private/create-expense', checkPermissionToken(['admin', 'manage_expenses']), createExpense);
expenseRouter.get('/private/manage-expenses', checkPermissionToken(['admin', 'manage_expenses']), manageExpenses);
expenseRouter.get('/private/manage-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageExpense);
expenseRouter.get('/private/manage-fetch-edit-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageFetchEditExpense);
expenseRouter.patch('/private/manage-edit-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageUpdateExpense);
expenseRouter.get('/private/manage-search-expenses', checkPermissionToken(['admin', 'manage_expenses']), manageSearchExpenses);

expenseRouter.get('/private/manage-search-expense-reports', checkPermissionToken(['admin', 'manage_expenses']), manageSearchExpenseReports);
// expenseRouter.get('/private/manage-account/:id', checkPermissionToken(['admin', 'manage_accounts']), manageAccount);

expenseRouter.delete('/private/manage-delete-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageDeleteExpense);
expenseRouter.post('/private/manage-delete-expenses', checkPermissionToken(['admin', 'manage_expenses']), manageDeleteExpenses);


// expenseRouter.get('/private/payment/:id', checkPermissionToken(['user', 'admin', 'manage_payments']), getPaymentDetails);
// expenseRouter.get('/private/manage-fetch-edit-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageFetchEditPayment);
// expenseRouter.get('/private/manage-get-payment-members/:id', checkPermissionToken(['admin', 'manage_payments']), manageGetPaymentMembers);
// expenseRouter.patch('/private/manage-edit-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageEditPayment);
// expenseRouter.post('/private/manage-mark-payments-as-paid', checkPermissionToken(['admin', 'manage_payments']), manageMarkPaymentsAsPaid);
// expenseRouter.post('/private/manage-mark-payments-as-unpaid', checkPermissionToken(['admin', 'manage_payments']), manageMarkPaymentsAsUnpaid);
// expenseRouter.get('/private/payments', checkPermissionToken(['user', 'admin', 'manage_payments']), payments);

// expenseRouter.patch('/private/manage-edit-donation-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageUpdateDonationPayment);
// expenseRouter.patch('/private/manage-edit-required-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageUpdateRequiredPayment);
// expenseRouter.patch('/private/manage-edit-contribution-payment/:id', checkPermissionToken(['admin', 'manage_payments']), manageUpdateContributionPayment);

// expenseRouter.get('/private/manage-search-accounts', checkPermissionToken(['admin', 'manage_accounts']), manageSearchAccounts);
// expenseRouter.get('/private/manage-account/:id', checkPermissionToken(['admin', 'manage_accounts']), manageAccount);

export default expenseRouter;