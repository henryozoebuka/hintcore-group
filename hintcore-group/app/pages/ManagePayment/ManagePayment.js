import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    const { id, paymentType } = route.params;

    const { colors } = useSelector((state) => state.colors);

    const [payment, setPayment] = useState(null);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'paid' | 'unpaid'
    const [selectedMembers, setSelectedMembers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMarkPayment, setLoadingMarkPayment] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
    const [confirmVisible, setConfirmVisible] = useState(false);

    // Expand/Collapse animation
    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useRef(new Animated.Value(100)).current;

    /** Fetch Payment Details */
    const fetchPaymentDetails = useCallback(async () => {
        try {
            const response = await privateAxios.get(`/private/manage-payment/${id}`);
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
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPaymentDetails();
    }, [fetchPaymentDetails]);

    /** Expand/Collapse Info Card */
    const toggleExpand = () => {
        Animated.timing(animatedHeight, {
            toValue: expanded ? 100 : 300,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

    /** Handle Search + Filter */
    const handleSearchAndFilter = (query, type) => {
        setSearchQuery(query);
        setFilterType(type);

        if (!payment) return;

        let members = [...payment.members];

        if (payment?.type === "required" || payment?.type === "contribution") {
            if (type === 'paid') {
                members = members.filter((m) => m.paid);
            } else if (type === 'unpaid') {
                members = members.filter((m) => !m.paid);
            }
        }

        if (query.trim()) {
            members = members.filter((m) =>
                (m.userId?.fullName || m.fullName || "")
                    .toLowerCase()
                    .includes(query.toLowerCase())
            );
        }

        setFilteredMembers(members);
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

            const endpoint =
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

                setTimeout(() => {
                    setNotification({
                        visible: false,
                        type: '',
                        message: '',
                    });
                }, 3000);

                await fetchPaymentDetails();
                handleSearchAndFilter(searchQuery, filterType); // Re-apply filter
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
        }
    };

    const renderMember = ({ item }) => {
        const type = payment?.type;

        if (type === 'donation') {
            return (
                <View style={{ ...stylesConfig.CARD, backgroundColor: colors.inputBackground, borderColor: colors.border }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '600' }}>
                            {item.fullName || item.userId?.fullName || 'Unnamed Donor'}
                        </Text>
                        <Text style={{ color: colors.primary }}>
                            Amount Donated: ₦{(item.amountPaid || 0).toLocaleString()}
                        </Text>
                    </View>
                </View>
            );
        }

        if (type === 'contribution') {
            return (
                <View style={{ ...stylesConfig.CARD, backgroundColor: colors.inputBackground, borderColor: colors.border }}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <View>
                            <Text style={{ color: colors.text, fontWeight: '600' }}>
                                {item.fullName || 'Unnamed Member'}
                            </Text>
                            <Text style={{ color: colors.placeholder }}>
                                Status: {item.paid ? '✅ Paid' : '❌ Unpaid'}
                            </Text>
                        </View>
                        <Text style={{ color: colors.primary }}>
                            Amount Paid: ₦{(item.amountPaid || 0).toLocaleString()}
                        </Text>
                    </View>
                </View>
            );
        }

        // Default for required
        const memberId = item.userId?._id;
        const isSelected = selectedMembers.includes(memberId);
        const showCheckbox = filterType !== 'all';

        return (
            <Pressable
                disabled={!showCheckbox}
                onPress={() => toggleSelectMember(memberId)}
                style={{
                    ...stylesConfig.CARD,
                    backgroundColor: colors.inputBackground,
                    borderColor: isSelected ? colors.primary : colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
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
                        {isSelected && <Text style={{ color: colors.mainButtonText, fontWeight: 'bold' }}>✓</Text>}
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>
                        {item?.fullName || 'Unnamed Member'}
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

    const selectedCount = selectedMembers.length;
    const actionLabel =
        filterType === 'paid'
            ? `Mark Selected as Unpaid (${selectedCount})`
            : `Mark Selected as Paid (${selectedCount})`;

    const markingLabel =
        filterType === 'paid'
            ? `Marking (${selectedCount}) as Unpaid...`
            : `Marking (${selectedCount}) as Paid...`;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', rowGap: 10, alignItems: 'center', padding: 20 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, flexShrink: 1, }}>
                    {paymentType[0]?.toUpperCase() + paymentType?.slice(1)} Details
                </Text>
                {payment &&
                    <Pressable
                        style={{
                            backgroundColor: colors.primary,
                            padding: 6,
                            borderRadius: 6,
                            alignSelf: 'center',
                        }}
                        onPress={() => navigation.navigate('manage-edit-payment', { id: payment._id, paymentType: payment?.type === 'required' ? 'Payment' : payment?.type })}
                    >
                        <Text style={{ color: colors.mainButtonText }}>Edit {paymentType[0]?.toUpperCase() + paymentType?.slice(1)}</Text>
                    </Pressable>}
            </View>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text }}>Loading payment details...</Text>
                </View>
            ) : (
                <View style={{ flex: 1, padding: 20 }}>
                    <Notification {...notification} />

                    {/* Payment Info */}
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
                        <Text style={{ color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                            {payment?.title}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 8 }}>{payment?.description}</Text>

                        {payment?.type === 'donation' || payment?.type === 'contribution' ? (
                            <Text
                                style={{
                                    color: colors.primary,
                                    fontSize: 18,
                                    fontWeight: '600',
                                    marginBottom: 8,
                                }}
                            >
                                Total Amount Paid: ₦{payment?.totalAmountPaid?.toLocaleString() || 0}
                            </Text>
                        ) : payment?.type === 'required' ? (
                            <>
                                <Text
                                    style={{
                                        color: colors.primary,
                                        fontSize: 18,
                                        fontWeight: '600',
                                        marginBottom: 4,
                                    }}
                                >
                                    Fixed Amount: ₦{payment?.amount?.toLocaleString() || 0}
                                </Text>
                                <Text
                                    style={{
                                        color: colors.primary,
                                        fontSize: 18,
                                        fontWeight: '600',
                                        marginBottom: 8,
                                    }}
                                >
                                    Total Collected: ₦{payment?.totalAmount?.toLocaleString() || 0}
                                </Text>
                            </>
                        ) : null}

                        <Text style={{ color: colors.text, marginBottom: 4 }}>
                            Due Date: {payment?.dueDate ? moment(payment.dueDate).format('MMMM DD, YYYY') : 'N/A'}
                        </Text>
                        <Text style={{ color: colors.text, marginBottom: 4 }}>Required: {payment?.type === 'required' ? 'Yes' : 'No'}</Text>
                        <Text style={{ color: colors.text }}>Published: {payment?.published ? 'Yes' : 'No'}</Text>
                        <Text style={{ color: colors.text }}>Created By: {payment?.createdBy?.fullName}</Text>
                        <Text style={{ color: colors.text }}>Created By: {moment(payment?.createdAt).format('MMMM DD, YYYY')}</Text>
                    </Animated.View>

                    <Pressable onPress={toggleExpand} style={{ marginBottom: 20, alignItems: 'center' }}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                            {expanded ? '▲ Show Less' : '▼ Show More'}
                        </Text>
                    </Pressable>

                    {/* Search & Filters */}
                    {/* Always show search bar */}
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

                    {/* Show paid/unpaid filters for required and contribution */}
                    {(payment?.type === 'required' || payment?.type === 'contribution') && (
                        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                            {renderFilterButton('All', 'all')}
                            {renderFilterButton('Paid', 'paid')}
                            {renderFilterButton('Unpaid', 'unpaid')}
                        </View>
                    )}


                    {/* Members List */}
                    <FlatList
                        data={filteredMembers}
                        keyExtractor={(item, index) => item.userId?._id || index.toString()}
                        renderItem={renderMember}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />

                    {/* Action Button */}
                    {selectedCount > 0 && filterType !== 'all' && (
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
                            <Pressable
                                onPress={confirmMarkSelected}
                                disabled={loadingMarkPayment}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    columnGap: 10,
                                }}
                            >
                                {loadingMarkPayment && (
                                    <ActivityIndicator size="small" color={colors.mainButtonText} />
                                )}
                                <Text style={{ color: colors.mainButtonText, fontSize: 16, fontWeight: 'bold' }}>
                                    {loadingMarkPayment ? markingLabel : actionLabel}
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
                    } ${selectedCount} member${selectedCount > 1 ? 's' : ''}?`}
                onConfirm={executeMarkSelected}
                onCancel={() => setConfirmVisible(false)}
            />

            <Footer />
        </View>
    );
};

export default ManagePayment;