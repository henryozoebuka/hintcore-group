// ManageEditPayment.jsx
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
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { AntDesign, Octicons } from '@expo/vector-icons';
import { MaskedTextInput } from 'react-native-mask-text';

import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const ManageEditPayment = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { id, paymentType } = route.params;

    const { colors } = useSelector((state) => state.colors);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    const [users, setUsers] = useState([]); // full user objects with amounts for donation
    const [membersLoading, setMembersLoading] = useState(false);

    const [payment, setPayment] = useState({
        title: '',
        description: '',
        amount: '',
        dueDate: null,
        type: 'required', // locked, will not change
        published: false,
    });

    const formatNumberWithCommas = (value) => {
        if (!value) return "";
        const num = value.toString().replace(/,/g, ""); // remove commas
        if (isNaN(num)) return "";
        return Number(num).toLocaleString("en-NG"); // format with commas
    };


    useEffect(() => {
        const fetchPayment = async () => {
            try {
                setInitialLoading(true);
                const response = await privateAxios.get(`/private/manage-fetch-edit-payment/${id}`);
                if (response.status === 200) {
                    const p = response.data.payment;
                    const parsedDate = p.dueDate ? new Date(p.dueDate) : null;

                    setPayment({
                        title: p.title,
                        description: p.description,
                        amount: p.amount ? p.amount.toString() : '',
                        dueDate: parsedDate,
                        type: p.type, // locked
                        published: p.published,
                    });

                    if (parsedDate) setDate(parsedDate);

                    // for donation, load members directly
                    if (p.type === 'donation') {
                        setUsers(p.members || []); // [{userId, fullName, amountPaid}]
                    }
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

        fetchPayment();
    }, [id]);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!showMembers) return;
            try {
                setMembersLoading(true);
                const res = await privateAxios.get(`/private/manage-get-payment-members/${id}`);
                if (res.status === 200) {
                    let fetched = (res.data.members || []).map((u) => ({
                        ...u,
                        originalAttached: u.attached,
                        originalAmountPaid: u.amountPaid ?? 0, // snapshot baseline
                    }));

                    // ✅ Force attach all for contribution type
                    if (payment.type === "contribution" || payment.type === "donation") {
                        fetched = fetched.map((x) => ({ ...x, attached: true }));
                    }

                    setUsers(fetched);
                }
            } catch (e) {
                setNotification({
                    visible: true,
                    type: 'error',
                    message: e?.response?.data?.message || 'Failed to fetch members.',
                });
            } finally {
                setMembersLoading(false);
            }
        };

        fetchMembers();
    }, [showMembers, id, payment.type]);

    const handleChange = (key, value) => {
        setPayment((prev) => ({ ...prev, [key]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
        setPayment((prev) => ({ ...prev, dueDate: currentDate }));
    };

    const handleDonationAmountChange = (userId, value) => {
        setUsers((prev) =>
            prev.map((u) =>
                u.userId === userId ? { ...u, amountPaid: Number(value) || 0 } : u
            )
        );
    };

const handleSubmit = async () => {
  try {
    setLoading(true);

    const payload = {
      ...payment,
      amount:
        payment.type === "required" || payment.type === "contribution"
          ? Number(payment.amount) || null
          : null,
    };

    // Required → only attached, no custom amounts
    if (payment.type === "required") {
      payload.members = users
        .filter((u) => u.attached)
        .map((u) => ({
          userId: u._id,
          amountPaid: 0,
        }));
    }

    // Contribution & Donation → only include members that changed
    if (payment.type === "contribution" || payment.type === "donation") {
      payload.members = users
        .filter((u) => {
          const amountChanged = u.amountPaid !== (u.originalAmountPaid ?? 0);
          const attachChanged = u.attached !== u.originalAttached;
          return amountChanged || attachChanged;
        })
        .map((u) => ({
          userId: u._id,
          amountPaid: u.amountPaid || 0,
        }));
    }

    // endpoint selection
    let endpoint = "";
    if (payment.type === "donation") {
      endpoint = `/private/manage-edit-donation-payment/${id}`;
    } else if (payment.type === "required") {
      endpoint = `/private/manage-edit-required-payment/${id}`;
    } else if (payment.type === "contribution") {
      endpoint = `/private/manage-edit-contribution-payment/${id}`;
    }

    const response = await privateAxios.patch(endpoint, payload);

    if (response.status === 200) {
      setNotification({
        visible: true,
        type: "success",
        message: response.data.message || "Payment updated successfully",
      });
      setTimeout(() => {
        setNotification({ visible: false, type: "", message: "" });
        navigation.navigate("manage-payment", { id, paymentType: payment?.type === 'required' ? 'Payment' : payment?.type });
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
                        Update {paymentType[0]?.toUpperCase() + paymentType?.slice(1)}
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
                        <Text style={{ color: colors.text }}>Loading Payment Details...</Text>
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
                                    value={payment.title}
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
                                    value={payment.description}
                                    onChangeText={(text) => handleChange('description', text)}
                                />

                                {/* Amount (for required / contribution only) */}
                                {payment.type === 'required' && (
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
                                        value={payment.amount}
                                        onChangeText={(masked, raw) =>
                                            handleChange('amount', raw === 'NaN' ? '' : raw)
                                        }
                                    />
                                )}

                                {/* Payment Type - locked */}
                                <Text style={{ color: colors.text, marginTop: 16 }}>
                                    Payment Type:{" "}
                                    <Text style={{ fontWeight: 'bold' }}>
                                        {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                                    </Text>{" "}
                                </Text>

                                {/* Due Date */}
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    style={[
                                        stylesConfig.CARD,
                                        {
                                            borderStyle: 'dotted',
                                            borderColor: colors.border2,
                                            backgroundColor: colors.inputBackground,
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            marginTop: 12,
                                        },
                                    ]}
                                >
                                    <AntDesign name="calendar" size={20} color={colors.text} />
                                    <Text style={{ color: colors.text, marginLeft: 10 }}>
                                        Select Due Date
                                    </Text>
                                </Pressable>
                                {payment.dueDate && (
                                    <Text style={{ color: colors.text, marginTop: 10 }}>
                                        {moment(payment.dueDate).format('MMMM D, YYYY')}
                                    </Text>
                                )}
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                    />
                                )}

                                {/* Members - only donation shows amount editing */}
                                <Pressable
                                    onPress={() => setShowMembers(true)}
                                    style={[
                                        stylesConfig.CARD,
                                        {
                                            borderStyle: 'dotted',
                                            borderColor: colors.border2,
                                            backgroundColor: colors.inputBackground,
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            marginTop: 12,
                                        },
                                    ]}
                                >
                                    <Octicons name="people" size={20} color={colors.text} />
                                    <Text style={{ color: colors.text, marginLeft: 10 }}>
                                        {payment.type === 'donation'
                                            ? 'View / Edit Donation Members'
                                            : "View Members' Contributions"}
                                    </Text>
                                </Pressable>

                                {/* Publish toggle */}
                                <Pressable
                                    onPress={() => handleChange('published', !payment.published)}
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
                                            backgroundColor: payment.published
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

                        {/* Members Modal */}
                        {showMembers && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 99,
                                }}
                            >
                                {membersLoading ? (
                                    <View
                                        style={{
                                            backgroundColor: colors.secondary,
                                            padding: 20,
                                            borderRadius: 12,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text style={{ color: colors.text, marginTop: 10 }}>
                                            Loading Members...
                                        </Text>
                                    </View>
                                ) : (
                                    <View
                                        style={{
                                            width: '90%',
                                            maxHeight: '85%',
                                            backgroundColor: colors.secondary,
                                            borderRadius: 12,
                                            padding: 20,
                                        }}
                                    >
                                        {/* Header */}
                                        <Text
                                            style={[
                                                stylesConfig.SETTINGS_STYLES.header,
                                                { color: colors.text, fontSize: 20 },
                                            ]}
                                        >
                                            {payment.type === 'donation'
                                                ? 'Donation Members'
                                                : 'Attached Members'}
                                        </Text>

                                        {/* Search */}
                                        <TextInput
                                            style={[
                                                stylesConfig.INPUT,
                                                {
                                                    backgroundColor: colors.inputBackground,
                                                    color: colors.text,
                                                    marginTop: 12,
                                                },
                                            ]}
                                            placeholder="Search member..."
                                            placeholderTextColor={colors.muted}
                                            onChangeText={(val) =>
                                                setUsers((prev) =>
                                                    prev.map((u) => ({
                                                        ...u,
                                                        visible:
                                                            u.fullName.toLowerCase().includes(val.toLowerCase()) ||
                                                            u._id.toLowerCase().includes(val.toLowerCase()),
                                                    }))
                                                )
                                            }
                                        />

                                        {/* Members list */}
                                        <ScrollView style={{ maxHeight: 300, marginTop: 12 }}>
                                            {users
                                                .filter((u) => u.visible !== false)
                                                .map((u) => (
                                                    <View
                                                        key={u._id}
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            marginBottom: 10,
                                                        }}
                                                    >
                                                        {/* Checkbox - only show if NOT contribution */}
                                                        {payment.type === 'required' && (
                                                            <Pressable
                                                                onPress={() =>
                                                                    setUsers((prev) =>
                                                                        prev.map((x) =>
                                                                            x._id === u._id
                                                                                ? { ...x, attached: !x.attached }
                                                                                : x
                                                                        )
                                                                    )
                                                                }
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    borderWidth: 1,
                                                                    borderColor: colors.text,
                                                                    backgroundColor: u.attached
                                                                        ? colors.primary
                                                                        : 'transparent',
                                                                    marginRight: 10,
                                                                }}
                                                            />
                                                        )}

                                                        {/* User Name */}
                                                        <Text style={{ color: colors.text, flex: 1 }}>
                                                            {u.fullName}
                                                        </Text>

                                                        {/* Donation / Contribution amount input */}
                                                        {(payment.type === 'donation' ||
                                                            payment.type === 'contribution') && (
                                                                <TextInput
                                                                    style={[
                                                                        stylesConfig.INPUT,
                                                                        {
                                                                            backgroundColor: colors.inputBackground,
                                                                            color: colors.text,
                                                                            width: 90,
                                                                            marginLeft: 10,
                                                                        },
                                                                    ]}
                                                                    keyboardType="numeric"
                                                                    value={formatNumberWithCommas(u.amountPaid || 0)}
                                                                    onChangeText={(val) =>
                                                                        setUsers((prev) =>
                                                                            prev.map((x) =>
                                                                                x._id === u._id
                                                                                    ? {
                                                                                        ...x,
                                                                                        amountPaid: Number(val.replace(/,/g, "")) || 0, // save raw number
                                                                                    }
                                                                                    : x
                                                                            )
                                                                        )
                                                                    }
                                                                />

                                                            )}
                                                    </View>
                                                ))}
                                        </ScrollView>


                                        {/* Buttons */}
                                        <View
                                            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                                        >

                                            {/* Cancel (force clear members) */}
                                            <Pressable
                                                onPress={() => {
                                                    // Clear all attached flags and reset amountPaid
                                                    setUsers((prev) =>
                                                        prev.map((x) => ({
                                                            ...x,
                                                            attached: x.originalAttached,
                                                            amountPaid: x.originalAmountPaid ?? 0,
                                                        }))
                                                    );

                                                    // Close modal
                                                    setShowMembers(false);
                                                }}
                                                style={[
                                                    stylesConfig.BUTTON,
                                                    { backgroundColor: colors.border2, marginTop: 20, flex: 1, marginRight: 8 },
                                                ]}
                                            >
                                                <Text
                                                    style={{
                                                        color: colors.text,
                                                        fontWeight: '600',
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Cancel
                                                </Text>
                                            </Pressable>


                                            {/* Done (keep changes) */}
                                            <Pressable
                                                onPress={() => setShowMembers(false)}
                                                style={[
                                                    stylesConfig.BUTTON,
                                                    { backgroundColor: colors.primary, marginTop: 20, flex: 1, marginLeft: 8 },
                                                ]}
                                            >
                                                <Text
                                                    style={{
                                                        color: colors.mainButtonText,
                                                        fontWeight: '600',
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    Done
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                    </View>
                )}
            </KeyboardAvoidingView>
            <Footer />
        </View>
    );
};

export default ManageEditPayment;