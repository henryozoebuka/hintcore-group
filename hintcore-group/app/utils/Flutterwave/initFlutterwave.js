// // utils/flutterwave/initFlutterwave.js

// import { FlutterwaveInitOptions, FlutterwaveCheckout } from 'flutterwave-react-native'; // Or your preferred method

// export const FlutterwaveInit = async ({
//     amount,
//     currency,
//     fullName,
//     email,
//     txRef,
//     onSuccess,
//     onError,
//     onCancel,
// }) => {
//     try {
//         console.log(email, fullName)
//         FlutterwaveCheckout({
//             public_key: 'YOUR_FLUTTERWAVE_PUBLIC_KEY',
//             tx_ref: txRef,
//             amount,
//             currency,
//             payment_options: 'card,mobilemoney,ussd',
//             customer: {
//                 email,
//                 name: fullName,
//             },
//             customizations: {
//                 title: 'Group Payment',
//                 description: 'Payment for group dues',
//                 logo: 'https://your-logo.png',
//             },
//             callback: (response) => {
//                 if (response.status === 'successful') {
//                     onSuccess && onSuccess(response);
//                 } else {
//                     onError && onError(response);
//                 }
//             },
//             onclose: () => {
//                 onCancel && onCancel();
//             },
//         });
//     } catch (err) {
//         console.error('Flutterwave Error:', err);
//         onError && onError(err);
//     }
// };



// utils/flutterwave/initFlutterwave.js

import { useFlutterwave } from 'flutterwave-react-native';

/**
 * Custom hook to initialize Flutterwave payment config
 * 
 * @param {Object} params
 * @param {number} params.amount - Payment amount
 * @param {string} params.currency - Currency (e.g., 'NGN')
 * @param {string} params.txRef - Unique transaction reference
 * @param {Object} params.user - Object containing fullName and email
 * 
 * @returns {Function} - Function to trigger Flutterwave payment
 */
export const useGroupPayment = ({ amount, currency, txRef, user }) => {
  const config = {
    public_key: 'YOUR_FLUTTERWAVE_PUBLIC_KEY',
    tx_ref: txRef,
    amount,
    currency,
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || 'email@example.com',
      name: user?.fullName || 'User',
    },
    customizations: {
      title: 'Group Payment',
      description: 'Payment for group dues',
      logo: 'https://your-logo.png',
    },
  };

  return useFlutterwave(config);
};
