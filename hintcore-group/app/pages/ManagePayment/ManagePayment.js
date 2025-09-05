import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    TextInput,
    FlatList,
    Pressable,
    Animated,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import stylesConfig from '../../styles/styles';

const ManagePayment = ({ navigation }) => {
    const route = useRoute();
    const { id } = route.params;

    const { colors } = useSelector((state) => state.colors);
    const [loading, setLoading] = useState(true);
    const [loadingMarkPayment, setLoadingMarkPayment] = useState(false);
    const [payment, setPayment] = useState(null);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all | paid | unpaid
    const [notification, setNotification] = useState({
        visible: false,
        type: '',
        message: '',
    });

    const [selectedMembers, setSelectedMembers] = useState([]);
    const [confirmVisible, setConfirmVisible] = useState(false);

    // show more/less animation
    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useRef(new Animated.Value(100)).current;

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

    const toggleExpand = () => {
        Animated.timing(animatedHeight, {
            toValue: expanded ? 100 : 300,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

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

    const toggleSelectMember = (memberId) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
        );
    };

    const confirmMarkSelected = () => {
        setConfirmVisible(true);
    };

    const executeMarkSelected = async () => {
        setConfirmVisible(false);
        if (selectedMembers.length === 0) return;

        try {
            setLoadingMarkPayment(true);
            let endpoint =
                filterType === 'paid'
                    ? '/private/manage-mark-payments-as-unpaid'
                    : '/private/manage-mark-payments-as-paid';

            const response = await privateAxios.post(endpoint, {
                paymentId: id,
                memberIds: selectedMembers,
            });

            if (response.status === 200) {
                setNotification({
                    visible: true,
                    type: 'success',
                    message: response.data.message,
                });

                // 🔑 Refetch payment
                const refreshed = await privateAxios.get(`/private/manage-payment/${id}`);
                setPayment(refreshed.data.payment);

                // 🔑 Reapply the current filter + search query
                let updatedMembers = refreshed.data.payment.members;

                if (filterType === 'paid') {
                    updatedMembers = updatedMembers.filter((m) => m.paid);
                } else if (filterType === 'unpaid') {
                    updatedMembers = updatedMembers.filter((m) => !m.paid);
                }

                if (searchQuery.trim()) {
                    updatedMembers = updatedMembers.filter((m) =>
                        m.userId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                }

                setFilteredMembers(updatedMembers);

                setSelectedMembers([]);
            }
        } catch (err) {
            setNotification({
                visible: true,
                type: 'error',
                message: err?.response?.data?.message || 'Failed to update members.',
            });
        } finally {
            setLoadingMarkPayment(false);
            setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
        }
    };


    const renderMember = ({ item }) => {
        const isSelected = selectedMembers.includes(item.userId?._id);

        const showCheckbox = filterType === 'paid' || filterType === 'unpaid';

        return (
            <Pressable
                disabled={!showCheckbox}
                onPress={() => toggleSelectMember(item.userId?._id)}
                style={{
                    ...stylesConfig.CARD,
                    backgroundColor: colors.inputBackground,
                    borderColor: isSelected ? colors.primary : colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {/* Checkbox */}
                {showCheckbox && (
                    <View
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.primary : colors.placeholder,
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            marginRight: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {isSelected && (
                            <Text style={{ color: colors.mainButtonText, fontWeight: 'bold' }}>✓</Text>
                        )}
                    </View>
                )}

                {/* Member Info */}
                <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>
                        {item.userId?.fullName || 'Unnamed Member'}
                    </Text>
                    <Text style={{ color: colors.placeholder }}>
                        Status: {item.paid ? '✅ Paid' : '❌ Unpaid'}
                    </Text>
                </View>
            </Pressable>
        );
    };

    const renderFilterButton = (label, value) => (
        <Pressable
            onPress={() => handleSearchAndFilter(searchQuery, value)}
            style={{
                ...stylesConfig.SMALL_BUTTON,
                backgroundColor: filterType === value ? colors.primary : colors.secondary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                marginRight: 8,
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
                    <Notification
                        visible={notification.visible}
                        type={notification.type}
                        message={notification.message}
                    />

                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text
                            style={{
                                fontSize: 24,
                                fontWeight: 'bold',
                                color: colors.text,
                                marginBottom: 16,
                            }}
                        >
                            Payment Details
                        </Text>
                        <Pressable
                            style={{
                                backgroundColor: colors.primary,
                                marginBottom: 12,
                                justifyContent: 'center',
                                padding: 5,
                                borderRadius: 5,
                            }}
                            onPress={() => navigation.navigate('manage-edit-payment', { id: payment._id })}
                        >
                            <Text style={{ color: colors.mainButtonText }}>Edit Payment</Text>
                        </Pressable>
                    </View>

                    {/* Payment Info Card (Collapsible) */}
                    <Animated.View
                        style={{
                            backgroundColor: colors.secondary,
                            padding: 16,
                            borderRadius: 12,
                            borderColor: colors.border,
                            borderWidth: 1,
                            marginBottom: 10,
                            overflow: 'hidden',
                            height: animatedHeight,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 20,
                                fontWeight: 'bold',
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
                                fontWeight: '600',
                                marginBottom: 8,
                            }}
                        >
                            Amount: ₦{payment?.amount?.toLocaleString()}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Due Date:{' '}
                            {payment?.dueDate
                                ? moment(payment.dueDate).format('MMMM DD, YYYY')
                                : 'N/A'}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Required: {payment?.required ? 'Yes' : 'No'}
                        </Text>
                        <Text style={{ color: colors.text }}>
                            Published: {payment?.published ? 'Yes' : 'No'}
                        </Text>
                    </Animated.View>

                    <Pressable onPress={toggleExpand} style={{ marginBottom: 20, alignItems: 'center' }}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                            {expanded ? '▲ Show Less' : '▼ Show More'}
                        </Text>
                    </Pressable>

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

                    <FlatList
                        data={filteredMembers}
                        keyExtractor={(item, index) => item.userId?._id || index.toString()}
                        renderItem={renderMember}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />

                    {/* Floating Action Button */}
                    {selectedMembers.length > 0 && (filterType === 'paid' || filterType === 'unpaid') && (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 80,
                                left: 20,
                                right: 20,
                                backgroundColor: colors.primary,
                                padding: 15,
                                borderRadius: 10,
                                alignItems: 'center',
                            }}
                        >
                            <Pressable onPress={confirmMarkSelected} disabled={loadingMarkPayment} style={{ flexDirection: 'row', columnGap: 10, justifyContent: 'center', alignItems: 'center' }}>
                                {loadingMarkPayment && <ActivityIndicator size="small" color={colors.mainButtonText} />}
                                <Text style={{ color: colors.mainButtonText, fontSize: 16, fontWeight: 'bold', }}>
                                    {
                                        loadingMarkPayment
                                            ? filterType === "paid"
                                                ? `Marking (${selectedMembers.length}) member${selectedMembers.length > 1 ? "s" : ""} as Unpaid`
                                                : `Marking (${selectedMembers.length}) member${selectedMembers.length > 1 ? "s" : ""} as Paid`
                                            : filterType === "paid"
                                                ? `Mark Selected as Unpaid (${selectedMembers.length})`
                                                : `Mark Selected as Paid (${selectedMembers.length})`
                                    }

                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                visible={confirmVisible}
                title="Confirm Action"
                message={`Are you sure you want to ${filterType === 'paid' ? 'mark as unpaid' : 'mark as paid'
                    } ${selectedMembers.length > 1 ? 'these' : 'this'} ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}?`}
                onConfirm={executeMarkSelected}
                onCancel={() => setConfirmVisible(false)}
            />

            <Footer />
        </View>
    );
};

export default ManagePayment;