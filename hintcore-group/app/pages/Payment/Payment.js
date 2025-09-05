import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, Pressable } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import privateAxios from "../../utils/axios/privateAxios";
import stylesConfig from "../../styles/styles";
import { PayWithFlutterwave } from "flutterwave-react-native";
import moment from "moment";
import Notification from "../../components/Notification/Notification";
import Footer from "../../components/Footer/Footer";
import Constants from "expo-constants"; // if using Expo for env vars

const Payment = () => {
    const { id } = useRoute().params;
    const { colors } = useSelector((state) => state.colors);

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({
        visible: false,
        type: "",
        message: "",
    });

    const env = Constants.expoConfig.extra; // configure in app.json or .env
    const isLive = env.FLW_MODE === "live";
    const PUBLIC_KEY = isLive ? env.FLW_PUBLIC_KEY_LIVE : env.FLW_PUBLIC_KEY_TEST;

    // Fetch payment details
    useEffect(() => {
        const fetchPayment = async () => {
            try {
                const response = await privateAxios.get(`/private/payment/${id}`);
                setPayment(response.data.payment);
            } catch (error) {
                setNotification({
                    visible: true,
                    type: "error",
                    message: error?.response?.data?.message || "Failed to fetch payment.",
                });
                setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchPayment();
    }, [id]);

    return (
        <View style={{ flex: 1 }}>
            {loading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: colors.background,
                    }}
                >
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text }}>Loading payment info...</Text>
                </View>
            ) : (
                <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
                    <Notification {...notification} />

                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            color: colors.text,
                            marginBottom: 16,
                        }}
                    >
                        Payment Info
                    </Text>

                    {/* Payment details card */}
                    <View
                        style={{
                            backgroundColor: colors.secondary,
                            padding: 16,
                            borderRadius: 12,
                            borderColor: colors.border,
                            borderWidth: 1,
                            marginBottom: 20,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 20,
                                fontWeight: "bold",
                                marginBottom: 8,
                            }}
                        >
                            {payment?.title}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 8 }}>
                            {payment?.description}
                        </Text>
                        <Text
                            style={{
                                color: colors.primary,
                                fontSize: 18,
                                fontWeight: "600",
                                marginBottom: 8,
                            }}
                        >
                            Amount: ₦{payment?.amount?.toLocaleString()}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Due Date:{" "}
                            {payment?.dueDate
                                ? moment(payment.dueDate).format("MMMM DD, YYYY")
                                : "N/A"}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Required: {payment?.required ? "Yes" : "No"}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Status: {payment?.paid ? "✅ Paid" : "❌ Unpaid"}
                        </Text>
                        <Text style={{ color: colors.text }}>
                            Created By:{" "}
                            {typeof payment?.createdBy === "string"
                                ? payment.createdBy
                                : payment?.createdBy?.fullName || "Unknown"}
                        </Text>
                    </View>

                    {/* Payment Button */}
                    {!payment?.paid ? (
                        <PayWithFlutterwave
                            options={{
                                tx_ref: `tx-${Date.now()}`,
                                authorization: PUBLIC_KEY,
                                amount: payment?.amount || 0,
                                currency: "NGN",
                                payment_options: "card,mobilemoney,ussd",
                                customer: {
                                    email: payment?.createdBy?.email || "customer@example.com",
                                    name: payment?.createdBy?.fullName || "User",
                                },
                                customizations: {
                                    title: "Group Payment",
                                    description: "Payment for group dues",
                                    logo: "https://your-logo.png",
                                },
                            }}
                            onRedirect={async (data) => {
                                if (data.status === "successful") {
                                    try {
                                        await privateAxios.post(
                                            `/private/confirm-payment/${payment._id}`,
                                            {
                                                tx_ref: data.tx_ref,
                                                transaction_id: data.transaction_id,
                                            }
                                        );
                                        setPayment({ ...payment, paid: true });
                                        Alert.alert("Success", "Payment confirmed successfully.");
                                    } catch {
                                        Alert.alert(
                                            "Error",
                                            "Payment was successful, but server confirmation failed."
                                        );
                                    }
                                } else {
                                    Alert.alert("Payment Failed", "Transaction was not successful.");
                                }
                            }}
                            customButton={(props) => (
                                <Pressable
                                    onPress={props.onPress}
                                    disabled={props.disabled}
                                    style={{
                                        ...stylesConfig.BUTTON,
                                        backgroundColor: colors.primary,
                                        opacity: props.disabled ? 0.7 : 1,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: colors.mainButtonText,
                                            fontSize: 16,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {props.disabled ? "Processing..." : "Make Payment"}
                                    </Text>
                                </Pressable>
                            )}
                        />
                    ) : (
                        <Text style={{ color: colors.primary, fontWeight: "600" }}>
                            Thank you! Your payment has been received.
                        </Text>
                    )}
                </View>
            )}
            <Footer />
        </View>
    );
};

export default Payment;
