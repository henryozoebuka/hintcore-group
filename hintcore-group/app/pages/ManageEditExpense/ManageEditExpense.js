import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { MaskedTextInput } from 'react-native-mask-text';

import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const ManageEditExpense = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { id } = route.params;

    const { colors } = useSelector((state) => state.colors);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
    const [date, setDate] = useState(new Date());

    const [expense, setExpense] = useState({
        title: '',
        description: '',
        amount: '',
        published: false,
    });

    const formatNumberWithCommas = (value) => {
        if (!value) return "";
        const num = value.toString().replace(/,/g, ""); // remove commas
        if (isNaN(num)) return "";
        return Number(num).toLocaleString("en-NG"); // format with commas
    };

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                setInitialLoading(true);
                const response = await privateAxios.get(`/private/manage-fetch-edit-expense/${id}`);
                if (response.status === 200) {
                    const p = response.data.expense;

                    setExpense({
                        title: p.title,
                        description: p.description,
                        amount: p.amount ? p.amount.toString() : '',
                        published: p.published,
                    });

                }
            } catch (e) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: e?.response?.data?.message || 'Failed to fetch.',
                });
            } finally {
                setInitialLoading(false);
            }
        };

        fetchExpense();
    }, [id]);


    const handleChange = (key, value) => {
        setExpense((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const payload = {
                ...expense,
                amount: Number(expense.amount),
            };

            const response = await privateAxios.patch(`/private/manage-edit-expense/${id}`, payload);

            if (response.status === 200) {
                setNotification({
                    visible: true,
                    type: "success",
                    message: response.data.message || "Expense updated successfully",
                });
                setTimeout(() => {
                    setNotification({ visible: false, type: "", message: "" });
                    navigation.navigate("manage-expense", { id });
                }, 1500);
            }
        } catch (e) {
            if (__DEV__) console.error(e);
            setNotification({
                visible: true,
                type: "error",
                message: e?.response?.data?.message || "Update failed.",
            });
            setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: colors.background }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />
                <View style={{ paddingHorizontal: 20, paddingTop: 15 }}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>
                        Update Expense
                    </Text>
                </View>

                {initialLoading ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: colors.background,
                        }}
                    >
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ color: colors.text }}>Loading Expense Details...</Text>
                    </View>
                ) : (
                    <View
                        style={[
                            stylesConfig.SETTINGS_STYLES.container,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <ScrollView
                            contentContainerStyle={{ alignItems: 'center', paddingBottom: 80 }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    maxWidth: 500,
                                    backgroundColor: colors.secondary,
                                    borderRadius: 10,
                                    padding: 16,
                                }}
                            >
                                {/* Title */}
                                <TextInput
                                    style={[
                                        stylesConfig.INPUT,
                                        { backgroundColor: colors.inputBackground, color: colors.text },
                                    ]}
                                    value={expense.title}
                                    onChangeText={(text) => handleChange('title', text)}
                                />

                                {/* Description */}
                                <TextInput
                                    multiline
                                    numberOfLines={4}
                                    style={[
                                        stylesConfig.INPUT,
                                        {
                                            textAlignVertical: 'top',
                                            height: 150,
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            marginTop: 12,
                                        },
                                    ]}
                                    value={expense.description}
                                    onChangeText={(text) => handleChange('description', text)}
                                />

                                {/* Amount */}

                                <MaskedTextInput
                                    type="currency"
                                    options={{
                                        prefix: '₦ ',
                                        decimalSeparator: '.',
                                        groupSeparator: ',',
                                        precision: 0,
                                    }}
                                    style={[
                                        stylesConfig.INPUT,
                                        {
                                            backgroundColor: colors.inputBackground,
                                            color: colors.text,
                                            marginTop: 12,
                                        },
                                    ]}
                                    keyboardType="numeric"
                                    value={expense.amount}
                                    onChangeText={(masked, raw) =>
                                        handleChange('amount', raw === 'NaN' ? '' : raw)
                                    }
                                />

                                {/* Publish toggle */}
                                <Pressable
                                    onPress={() => handleChange('published', !expense.published)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginVertical: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderWidth: 1,
                                            borderColor: colors.text,
                                            marginRight: 8,
                                            backgroundColor: expense.published
                                                ? colors.primary
                                                : 'transparent',
                                        }}
                                    />
                                    <Text style={{ color: colors.text, fontSize: 16 }}>
                                        Publish Now
                                    </Text>
                                </Pressable>

                                {/* Submit */}
                                <Pressable
                                    onPress={handleSubmit}
                                    style={{
                                        marginTop: 24,
                                        backgroundColor: colors.primary,
                                        paddingVertical: 14,
                                        borderRadius: 10,
                                        columnGap: 10,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                    }}
                                    disabled={loading}
                                >
                                    {loading && <ActivityIndicator color={colors.mainButtonText} />}
                                    <Text style={{ color: colors.mainButtonText }}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                )}
            </KeyboardAvoidingView>
            <Footer />
        </View>
    );
};

export default ManageEditExpense;