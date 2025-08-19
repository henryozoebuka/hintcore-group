import {configureStore} from '@reduxjs/toolkit';
import colorsReducer from './slices/colorsSlice.js';
import authReducer from './slices/authSlice.js';
// import menuReducer from './slices/menuSlice.js';
// import textInputReducer from './slices/textInputSlice.js';
// import buttonReducer from './slices/buttonSlice.js';
// import buttonTextReducer from './slices/buttonTextSlice.js';
// import serverURLReducer from './slices/serverURLSlice.js';
// import successReducer from './slices/successSlice.js';
// import failureReducer from './slices/failureSlice.js';
// import loadingReducer from './slices/loadingSlice.js';
// import userReducer from './slices/userSlice.js';
// import usersReducer from './slices/usersSlice.js';
// import announcementReducer from './slices/announcementSlice.js';
// import announcementsReducer from './slices/announcementsSlice.js';
// import eventReducer from './slices/eventSlice.js';
// import eventsReducer from './slices/eventsSlice.js';
// import minutesReducer from './slices/minutesSlice.js';
// import minutesArchiveReducer from './slices/minutesArchiveSlice.js';
// import paymentReducer from './slices/paymentSlice.js';
// import paymentsReducer from './slices/paymentsSlice.js';
// import userPaymentsReducer from './slices/userPaymentsSlice.js';
// import paymentApprovalsReducer from './slices/paymentApprovalsSlice.js';
// import paymentApprovalReducer from './slices/paymentApprovalSlice.js';
// import constitutionReducer from './slices/constitutionSlice.js';
// import constitutionsReducer from './slices/constitutionsSlice.js';
// import clubTransferReducer from './slices/clubTransferSlice.js';
// import clubTransfersReducer from './slices/clubTransfersSlice.js';
// import transactionHistoryReducer from './slices/transactionHistorySlice.js';
// import adminTransactionHistoryReducer from './slices/adminTransactionHistorySlice.js';
// import viewTransactionHistoryReducer from './slices/viewTransactionHistorySlice.js';
// import userPaymentApprovalReducer from './slices/userPaymentApprovalSlice.js';
// import userPaymentApprovalsReducer from './slices/userPaymentApprovalsSlice.js';
// import isLoggedInReducer from './slices/isLoggedInSlice.js';
// import loadingInfoReducer from './slices/loadingInfoSlice.js';

export default configureStore({
    reducer: {
        colors: colorsReducer,
        auth: authReducer,
        // menu: menuReducer,
        // textInput: textInputReducer,
        // button: buttonReducer,
        // buttonText: buttonTextReducer,
        // serverURL: serverURLReducer,
        // success: successReducer,
        // failure: failureReducer,
        // loading: loadingReducer,
        // user: userReducer,
        // users: usersReducer,
        // announcement: announcementReducer,
        // announcements: announcementsReducer,
        // event: eventReducer,
        // events: eventsReducer,
        // minutes: minutesReducer,
        // minutesArchive: minutesArchiveReducer,
        // payment: paymentReducer,
        // payments: paymentsReducer,
        // userPayments: userPaymentsReducer,
        // paymentApprovals: paymentApprovalsReducer,
        // paymentApproval: paymentApprovalReducer,
        // constitution: constitutionReducer,
        // constitutions: constitutionsReducer,
        // clubTransfer: clubTransferReducer,
        // clubTransfers: clubTransfersReducer,
        // transactionHistory: transactionHistoryReducer,
        // adminTransactionHistory: adminTransactionHistoryReducer,
        // viewTransactionHistory: viewTransactionHistoryReducer,
        // userPaymentApproval: userPaymentApprovalReducer,
        // userPaymentApprovals: userPaymentApprovalsReducer,
        // isLoggedIn: isLoggedInReducer,
        // loadingInfo: loadingInfoReducer,
    }
});