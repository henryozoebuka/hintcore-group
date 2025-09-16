import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const ManageExpense = ({ navigation }) => {
    const route = useRoute();
    const { id } = route.params;

    const { colors } = useSelector((state) => state.colors);

    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '' });



    useEffect(() => {
        /** Fetch Expense Details */
        const fetchExpenseDetails = async () => {
            try {
                const response = await privateAxios.get(`/private/manage-expense/${id}`);
                if (response.status === 200) {
                    setExpense(response.data.expense);
                }
            } catch (err) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: err?.response?.data?.message || 'Failed to fetch expense info.',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchExpenseDetails();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', rowGap: 10, alignItems: 'center', padding: 20 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, flexShrink: 1, }}>
                    Expense Details
                </Text>
                {expense &&
                    <Pressable
                        style={{
                            backgroundColor: colors.primary,
                            padding: 6,
                            borderRadius: 6,
                            alignSelf: 'center',
                        }}
                        onPress={() => navigation.navigate('manage-edit-expense', { id: expense._id })}
                    >
                        <Text style={{ color: colors.mainButtonText }}>Edit Expense</Text>
                    </Pressable>}
            </View>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text }}>Loading Expense Details...</Text>
                </View>
            ) : (
                <View style={{ flex: 1, padding: 20 }}>
                    <Notification {...notification} />

                    {/* Expense Info */}
                    <View
                        style={{
                            backgroundColor: colors.secondary,
                            padding: 16,
                            borderRadius: 12,
                            borderColor: colors.border,
                            borderWidth: 1,
                            marginBottom: 10,
                            overflow: 'hidden',
                        }}
                    >
                        <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                            {expense?.title}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 8 }}>{expense?.description}</Text>

                            <Text
                                style={{
                                    color: colors.primary,
                                    fontSize: 18,
                                    fontWeight: '600',
                                    marginBottom: 8,
                                }}
                            >
                                Amount: ₦{expense?.amount?.toLocaleString() || 0}
                            </Text>

                        <Text style={{ color: colors.text }}>Published: {expense?.published ? 'Yes' : 'No'}</Text>
                        <Text style={{ color: colors.text }}>Created By: {expense?.createdBy?.fullName}</Text>
                        <Text style={{ color: colors.text }}>Created On: {moment(expense?.createdAt).format('MMMM DD, YYYY')}</Text>
                        <Text style={{ color: colors.text }}>Last Update On: {moment(expense?.updatedAt).format('MMMM DD, YYYY')}</Text>
                        </View>
                </View>
            )}

            <Footer />
        </View>
    );
};

export default ManageExpense;