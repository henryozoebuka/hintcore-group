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
    const { id } = route.params;

    const { colors } = useSelector((state) => state.colors);

    const [loading, setLoading] = useState(false);
    const [initialloading, setInitialLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    const [users, setUsers] = useState([]); // full user objects from API
    const [selectedUsers, setSelectedUsers] = useState([]); // only selected user IDs
    const [selectAll, setSelectAll] = useState(false);

    const [payment, setPayment] = useState({
        title: '',
        description: '',
        amount: '',
        dueDate: null,
        required: false,
        published: false,
    });

    // Fetch Payment & Members together on mount
    useEffect(() => {
        const fetchPayment = async () => {
            try {
                setInitialLoading(true);
                const response = await privateAxios.get(`private/manage-fetch-edit-payment/${id}`);
                if (response.status === 200) {
                    const p = response.data.payment;
                    const parsedDate = p.dueDate ? new Date(p.dueDate) : null;

                    setPayment({
                        title: p.title,
                        description: p.description,
                        amount: p.amount.toString(),
                        dueDate: parsedDate,
                        required: p.required,
                        published: p.published,
                    });

                    if (parsedDate) setDate(parsedDate);

                    // Members come as full user objects with `selected` flag
                    setUsers(p.members);
                    const preselected = p.members.filter(u => u.selected).map(u => u._id);
                    setSelectedUsers(preselected);
                    setSelectAll(preselected.length === p.members.length);
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

    const handleChange = (key, value) => {
        setPayment((prev) => ({ ...prev, [key]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(false);
        setDate(currentDate);
        setPayment((prev) => ({ ...prev, dueDate: currentDate }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                ...payment,
                amount: Number(payment.amount),
                members: selectedUsers, // send only selected user IDs
            };

            const res = await privateAxios.put(`private/manage-payment/${id}`, payload);
            if (res.status === 200) {
                setNotification({ visible: true, type: 'success', message: 'Payment updated successfully' });
                setTimeout(() => {
                    setNotification({ visible: false, type: '', message: '' });
                    navigation.goBack();
                }, 1500);
            }
        } catch (e) {
            setNotification({
                visible: true,
                type: 'error',
                message: e?.response?.data?.message || 'Update failed.',
            });
            setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {initialloading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text }}>Loading Payment Details...</Text>
                </View>
            ) : (
                <KeyboardAvoidingView
                    style={{ flex: 1, backgroundColor: colors.background }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                        <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                        <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Edit Payment</Text>

                        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 80 }}>
                            <View style={{
                                width: '100%',
                                maxWidth: 500,
                                backgroundColor: colors.secondary,
                                borderRadius: 10,
                                padding: 16,
                            }}>
                                {/* Title */}
                                <View style={{ borderColor: colors.border2, borderWidth: 1, borderRadius: 5, borderStyle: 'dotted' }}>
                                    <TextInput
                                        style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                                        placeholder="Enter payment title"
                                        placeholderTextColor={colors.placeholder}
                                        value={payment.title}
                                        onChangeText={(text) => handleChange('title', text)}
                                    />
                                </View>

                                {/* Description */}
                                <View style={{ borderColor: colors.border2, borderWidth: 1, borderRadius: 5, borderStyle: 'dotted', marginTop: 12 }}>
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
                                            },
                                        ]}
                                        placeholder="Type description here..."
                                        placeholderTextColor={colors.placeholder}
                                        value={payment.description}
                                        onChangeText={(text) => handleChange('description', text)}
                                    />
                                </View>

                                {/* Amount */}
                                <View style={{ borderColor: colors.border2, borderRadius: 5, borderWidth: 1, borderStyle: 'dotted', marginTop: 12 }}>
                                    <MaskedTextInput
                                        type="currency"
                                        options={{
                                            prefix: '₦ ',
                                            decimalSeparator: '.',
                                            groupSeparator: ',',
                                            precision: 0,
                                        }}
                                        style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                                        keyboardType="numeric"
                                        placeholder="Enter payment amount"
                                        placeholderTextColor={colors.placeholder}
                                        value={payment.amount}
                                        onChangeText={(masked, raw) => {
                                            handleChange('amount', raw === 'NaN' || raw === null ? '' : raw);
                                        }}
                                    />
                                </View>

                                {/* Due Date */}
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    style={[stylesConfig.CARD, {
                                        borderStyle: 'dotted',
                                        borderColor: colors.border2,
                                        backgroundColor: colors.inputBackground,
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        marginTop: 12,
                                    }]}
                                >
                                    <AntDesign name="calendar" size={20} color={colors.text} />
                                    <Text style={{ color: colors.text, marginLeft: 10 }}>Select Due Date</Text>
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

                                {/* Members Modal Trigger */}
                                <Pressable
                                    onPress={() => setShowMembers(true)}
                                    style={[stylesConfig.CARD, {
                                        borderStyle: 'dotted',
                                        borderColor: colors.border2,
                                        backgroundColor: colors.inputBackground,
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        marginTop: 12,
                                    }]}
                                >
                                    <Octicons name="people" size={20} color={colors.text} />
                                    <Text style={{ color: colors.text, marginLeft: 10 }}>Edit Members</Text>
                                </Pressable>

                                {/* Publish / Required toggles */}
                                {['published', 'required'].map((field) => (
                                    <Pressable
                                        key={field}
                                        onPress={() => handleChange(field, !payment[field])}
                                        style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
                                    >
                                        <View
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderWidth: 1,
                                                borderColor: colors.text,
                                                marginRight: 8,
                                                backgroundColor: payment[field] ? colors.primary : "transparent",
                                            }}
                                        />
                                        <Text style={{ color: colors.text, fontSize: 16 }}>
                                            {field === 'published' ? 'Publish Now' : 'Required'}
                                        </Text>
                                    </Pressable>
                                ))}

                                {/* Submit Button */}
                                <Pressable
                                    onPress={handleSubmit}
                                    style={{
                                        marginTop: 24,
                                        backgroundColor: colors.primary,
                                        paddingVertical: 14,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                        columnGap: 10,
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

                        {/* Member Selection Modal */}
                        {showMembers && (
                            <View style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 99,
                            }}>
                                <View style={{
                                    width: '90%',
                                    maxHeight: '80%',
                                    backgroundColor: colors.secondary,
                                    borderRadius: 12,
                                    padding: 20,
                                }}>
                                    <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text, fontSize: 20 }]}>
                                        Edit Members
                                    </Text>

                                    {/* Select All */}
                                    <Pressable
                                        onPress={() => {
                                            if (selectAll) {
                                                setSelectedUsers([]);
                                                setSelectAll(false);
                                            } else {
                                                setSelectedUsers(users.map(u => u._id));
                                                setSelectAll(true);
                                            }
                                        }}
                                        style={[stylesConfig.CARD, { backgroundColor: colors.inputBackground, borderColor: colors.border2 }]}
                                    >
                                        <View
                                            style={[
                                                stylesConfig.CHECKBOX,
                                                {
                                                    borderColor: colors.text,
                                                    backgroundColor: selectAll ? colors.primary : 'transparent',
                                                },
                                            ]}
                                        />
                                        <Text style={{ color: colors.text, fontSize: 16 }}>Select All</Text>
                                    </Pressable>

                                    {/* Individual Members */}
                                    <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
                                        {users.map((user) => {
                                            const isSelected = selectedUsers.includes(user._id);
                                            return (
                                                <Pressable
                                                    key={user._id}
                                                    onPress={() => {
                                                        const updated = isSelected
                                                            ? selectedUsers.filter(id => id !== user._id)
                                                            : [...selectedUsers, user._id];
                                                        setSelectedUsers(updated);
                                                        setSelectAll(updated.length === users.length);
                                                    }}
                                                    style={[stylesConfig.CARD, {
                                                        backgroundColor: colors.inputBackground,
                                                        borderColor: colors.border2,
                                                        marginBottom: 8,
                                                    }]}
                                                >
                                                    <View
                                                        style={[
                                                            stylesConfig.CHECKBOX,
                                                            {
                                                                borderColor: colors.text,
                                                                backgroundColor: isSelected ? colors.primary : 'transparent',
                                                            },
                                                        ]}
                                                    />
                                                    <Text style={{ color: colors.text }}>{user.fullName}</Text>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>

                                    <Pressable
                                        onPress={() => setShowMembers(false)}
                                        style={[stylesConfig.BUTTON, { backgroundColor: colors.primary, marginTop: 20 }]}
                                    >
                                        <Text style={{ color: colors.mainButtonText, fontWeight: '600' }}>Done</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            )}
            <Footer />
        </View>
    );
};

export default ManageEditPayment;
