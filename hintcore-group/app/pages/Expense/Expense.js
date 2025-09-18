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

const Expense = () => {
    const { id } = useRoute().params;
    const { colors } = useSelector((state) => state.colors);

    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({
        visible: false,
        type: "",
        message: "",
    });

    const env = Constants.expoConfig.extra; // configure in app.json or .env
    const isLive = env.FLW_MODE === "live";
    const PUBLIC_KEY = isLive ? env.FLW_PUBLIC_KEY_LIVE : env.FLW_PUBLIC_KEY_TEST;

    // Fetch expense details
    useEffect(() => {
        const fetchExpense = async () => {
            try {
                const response = await privateAxios.get(`/private/expense/${id}`);
                setExpense(response.data.expense);
            } catch (error) {
                setNotification({
                    visible: true,
                    type: "error",
                    message: error?.response?.data?.message || "Failed to fetch expense.",
                });
                setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchExpense();
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
                    <Text style={{ color: colors.text }}>Loading expense info...</Text>
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
                        Expense Info
                    </Text>

                    {/* Expense details card */}
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
                            {expense?.title}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 8 }}>
                            {expense?.description}
                        </Text>
                        <Text
                            style={{
                                color: colors.primary,
                                fontSize: 18,
                                fontWeight: "600",
                                marginBottom: 8,
                            }}
                        >
                            Amount: ₦{expense?.amount?.toLocaleString()}
                        </Text>
                        
                        <Text style={{ color: colors.text }}>
                            Created By:{" "}
                            {typeof expense?.createdBy === "string"
                                ? expense.createdBy
                                : expense?.createdBy?.fullName || "Unknown"}
                        </Text>
                    </View>
                </View>
            )}
            <Footer />
        </View>
    );
};

export default Expense;
