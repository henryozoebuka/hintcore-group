import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    TextInput,
    FlatList,
    Pressable,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const ManagePayment = ({navigation}) => {
    const route = useRoute();
    const { id } = route.params;

    const { colors } = useSelector((state) => state.colors);
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState(null);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'paid' | 'unpaid'
    const [notification, setNotification] = useState({
        visible: false,
        type: '',
        message: '',
    });

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            try {
                const response = await privateAxios.get(`private/manage-payment/${id}`);
                if (response.status === 200) {
                    setPayment(response.data.payment);
                    setFilteredMembers(response.data.payment.members || []);
                }
            } catch (err) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: err?.response?.data?.message || 'Failed to fetch payment info.',
                });
                setTimeout(() => {
                    setNotification({ visible: false, type: '', message: '' });
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [id]);

    const handleSearchAndFilter = (query, type) => {
        setSearchQuery(query);
        setFilterType(type);

        if (!payment) return;

        let result = payment.members;

        if (type === 'paid') {
            result = result.filter((member) => member.paid);
        } else if (type === 'unpaid') {
            result = result.filter((member) => !member.paid);
        }

        if (query.trim()) {
            result = result.filter((member) =>
                member.userId?.fullName?.toLowerCase().includes(query.toLowerCase())
            );
        }

        setFilteredMembers(result);
    };

    const renderMember = ({ item }) => (
        <View
            style={{
                ...stylesConfig.CARD,
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
            }}
        >
            <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {item.userId?.fullName || 'Unnamed Member'}
                </Text>
                <Text style={{ color: colors.placeholder }}>
                    Status: {item.paid ? '✅ Paid' : '❌ Unpaid'}
                </Text>
            </View>
        </View>
    );

    const renderFilterButton = (label, value) => (
        <Pressable
            onPress={() => handleSearchAndFilter(searchQuery, value)}
            style={{
                ...stylesConfig.SMALL_BUTTON,
                backgroundColor: filterType === value ? colors.primary : colors.secondary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
            }}
        >
            <Text
                style={{
                    color: filterType === value ? colors.mainButtonText : colors.text,
                    fontWeight: '600',
                }}
            >
                {label}
            </Text>
        </Pressable>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text }}>Loading payment details...</Text>
                </View>
            ) : (
                <View style={{ flex: 1, padding: 20 }}>
                    <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
                            Payment Details
                        </Text>
                        <Pressable style={{ backgroundColor: colors.primary, marginBottom: 12, justifyContent: 'center', padding: 5, borderRadius: 5 }} onPress={() => navigation.navigate("manage-edit-payment", { id: payment._id })}>
                            <Text style={{ color: colors.mainButtonText, }}>Edit Payment</Text>
                        </Pressable>
                    </View>

                    {/* Payment Info Card */}
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
                        <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                            {payment?.title}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 8 }}>
                            {payment?.description}
                        </Text>

                        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                            Amount: ₦{payment?.amount?.toLocaleString()}
                        </Text>

                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Due Date: {payment?.dueDate ? moment(payment.dueDate).format('MMMM DD, YYYY') : 'N/A'}
                        </Text>

                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Required: {payment?.required ? 'Yes' : 'No'}
                        </Text>

                        <Text style={{ color: colors.text }}>
                            Published: {payment?.published ? 'Yes' : 'No'}
                        </Text>
                    </View>

                    {/* Search and Filters */}
                    <TextInput
                        style={{
                            ...stylesConfig.INPUT,
                            backgroundColor: colors.inputBackground,
                            color: colors.text,
                            borderColor: colors.border,
                            borderWidth: 1,
                            marginBottom: 12,
                        }}
                        placeholder="Search member by name"
                        placeholderTextColor={colors.placeholder}
                        value={searchQuery}
                        onChangeText={(text) => handleSearchAndFilter(text, filterType)}
                    />

                    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                        {renderFilterButton('All', 'all')}
                        {renderFilterButton('Paid', 'paid')}
                        {renderFilterButton('Unpaid', 'unpaid')}
                    </View>

                    {/* Members List */}
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
                        Members Payment Status
                    </Text>

                    {filteredMembers.length > 0 ? (
                        <FlatList
                            data={filteredMembers}
                            keyExtractor={(item, index) => item.userId?._id || index.toString()}
                            renderItem={renderMember}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 120 }}
                        />
                    ) : (
                        <Text style={{ color: colors.placeholder }}>No matching members found.</Text>
                    )}
                </View>
            )}

            <Footer />
        </View>
    );
};

export default ManagePayment;