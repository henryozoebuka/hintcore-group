import express from 'express';
import { createExpense, getExpense, getExpenses, manageDeleteExpense, manageDeleteExpenses, manageExpense, manageExpenses, manageFetchEditExpense, manageSearchExpenseReports, manageSearchExpenses, manageUpdateExpense, searchExpenses} from '../controllers/expenseControllers.js';
import { checkPermissionToken } from '../middlewares/checkTokens.js';

const expenseRouter = express.Router();

expenseRouter.get('/private/expense/:id', checkPermissionToken(['admin', 'manage_expenses', 'expenses']), getExpense);
expenseRouter.get('/private/expenses', checkPermissionToken(['admin', 'manage_expenses', 'expenses']), getExpenses);
expenseRouter.get('/private/search-expenses', checkPermissionToken(['admin', 'manage_expenses', 'expenses']), searchExpenses);

// Admin and Group Manager Private Routes
expenseRouter.post('/private/create-expense', checkPermissionToken(['admin', 'manage_expenses']), createExpense);
expenseRouter.get('/private/manage-expenses', checkPermissionToken(['admin', 'manage_expenses']), manageExpenses);
expenseRouter.get('/private/manage-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageExpense);
expenseRouter.get('/private/manage-fetch-edit-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageFetchEditExpense);
expenseRouter.patch('/private/manage-edit-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageUpdateExpense);
expenseRouter.get('/private/manage-search-expenses', checkPermissionToken(['admin', 'manage_expenses']), manageSearchExpenses);
expenseRouter.get('/private/manage-search-expense-reports', checkPermissionToken(['admin', 'manage_expenses']), manageSearchExpenseReports);
expenseRouter.delete('/private/manage-delete-expense/:id', checkPermissionToken(['admin', 'manage_expenses']), manageDeleteExpense);
expenseRouter.post('/private/manage-delete-expenses', checkPermissionToken(['admin', 'manage_expenses']), manageDeleteExpenses);

export default expenseRouter;