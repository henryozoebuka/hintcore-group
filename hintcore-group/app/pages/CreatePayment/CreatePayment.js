import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import privateAxios from "../../utils/axios/privateAxios";
import Notification from "../../components/Notification/Notification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import { AntDesign, Octicons } from '@expo/vector-icons';
import { MaskedTextInput } from 'react-native-mask-text';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const CreatePayment = ({ navigation }) => {
    const { colors } = useSelector((state) => state.colors);
    const [notification, setNotification] = useState({ visible: false, type: "", message: "" });
    const [group, setGroup] = useState('');
    const [createdBy, setCreatedBy] = useState('');
    const [loading, setLoading] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [date, setDate] = useState(new Date());
    const [showMembers, setShowMembers] = useState(false);
    const [data, setData] = useState({ title: '', description: '', amount: '', dueDate: null, published: false });

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Dummy data/functions
    // const selectAllMembers = () => { };
    // const toggleShowMembers = () => setShowMembers(!showMembers);
    // const toggleSelection = () => { };
    const handleChange = (value, key) => setData((prev) => ({ ...prev, [key]: value }));

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(false);
        setDate(currentDate);
        setData((prev) => ({ ...prev, dueDate: currentDate }));
    };

    const handleSubmit = async () => {
        if (!data.title || !data.description || !data.amount) {
            setNotification({ visible: true, type: "error", message: "Title, description, and amount must be filled" });
            setTimeout(() => {
                setNotification({ visible: false, type: "", message: "" });
            }, 3000);
            return;
        }

        if (!group || !createdBy) {
            setNotification({
                visible: true,
                type: "error",
                message: "User or Group ID is missing. Please try again.",
            });
            return;
        }

        // if (selectedUsers.length === 0) {
        //     setNotification({visible: true, type: "error", message: "Please select at least one member.",});
        //     return;
        // }

        try {
            setLoading(true);
            const response = await privateAxios.post('/private/create-payment', {
                createdBy,
                group,
                ...data,
                members: selectedUsers,
            });

            if (response.status === 201) {
                setData({ title: '', description: '', amount: '', dueDate: null, published: false })
                setNotification({ visible: true, type: "success", message: response.data.message || "Payment created successfully" });
                setTimeout(() => {
                    setNotification({ visible: false, type: "", message: "" });
                    navigation.navigate("manage-payments");
                }, 3000);
            }
            setLoading(true);
        } catch (error) {
            console.error("Error creating payment: ", error)
            if (error?.response?.data?.message) {
                setNotification({ visible: true, type: "error", message: error.response.data.message });
                setTimeout(() => {
                    setNotification({ visible: false, type: "", message: "" });
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchIds = async () => {
            try {
                const getGroupId = await AsyncStorage.getItem("currentGroupId");
                const getUserId = await AsyncStorage.getItem("userId");

                if (!getGroupId || !getUserId) {
                    setNotification({visible: true, type: "error", message: "User or Group ID missing. Please try again.",});
                    setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
                    return;
                }

                setGroup(getGroupId);
                setCreatedBy(getUserId);
            } catch (error) {
                setNotification({visible: true, type: "error", message: "Failed to load user or group information.",});
                setTimeout(() => setNotification({ visible: false, type: "", message: "" }), 3000);
            }
        };

        fetchIds();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!showMembers) return;

            try {
                setMembersLoading(true);
                const response = await privateAxios.get(`/private/group-members/${group}`);
                setUsers(response.data?.users || []);
            } catch (error) {
                console.error("Failed to fetch users", error);
                if (error?.response?.data?.message) {
                    setNotification({ visible: true, type: "error", message: "Failed to fetch group members" });
                    setTimeout(() => {
                        setNotification({ visible: false, type: "", message: "" });
                    }, 3000);
                }
            } finally {
                setMembersLoading(false);
            }
        };

        fetchUsers();
    }, [showMembers]);

    return (
        <View style={{ flex: 1 }}>
            <View style={[stylesConfig.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />

                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>
                    Create Payment
                </Text>
                <ScrollView
                    contentContainerStyle={{ alignItems: 'center', paddingBottom: 80 }}
                    style={{ flex: 1 }}
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
                            style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                            placeholder="Enter payment title"
                            placeholderTextColor={colors.placeholder}
                            onChangeText={(value) => handleChange(value, 'title')}
                            value={data.title}
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
                                },
                            ]}
                            placeholder="Type description here..."
                            placeholderTextColor={colors.placeholder}
                            onChangeText={(value) => handleChange(value, 'description')}
                            value={data.description}
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
                            style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                            keyboardType="numeric"
                            placeholder="Enter payment amount"
                            placeholderTextColor={colors.placeholder}
                            value={data.amount}
                            onChangeText={(masked, raw) => {
                                setData((prev) => ({
                                    ...prev,
                                    amount: raw === 'NaN' || raw === null ? '' : raw,
                                }));
                            }}
                        />

                        {/* Due Date Picker */}
                        <Pressable
                            onPress={() => setShow(true)}
                            style={[
                                stylesConfig.CARD,
                                {
                                    borderStyle: 'dotted',
                                    borderColor: colors.border,
                                    backgroundColor: colors.inputBackground,
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                },
                            ]}
                        >
                            <AntDesign name="calendar" size={20} color={colors.text} />
                            <Text style={{ color: colors.text, marginLeft: 10 }}>Select Due Date</Text>
                        </Pressable>

                        {/* Display selected date */}
                        {data.dueDate && (
                            <Text style={{ color: colors.text, marginTop: 10 }}>
                                {data.dueDate.toDateString()}
                            </Text>
                        )}

                        {/* Native date picker */}
                        {show && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onChange}
                            />
                        )}

                        {/* Select Members */}
                        <Pressable
                            onPress={() => setShowMembers(true)}
                            style={[
                                stylesConfig.CARD,
                                {
                                    borderStyle: 'dotted',
                                    borderColor: colors.border,
                                    backgroundColor: colors.inputBackground,
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    marginTop: 16,
                                },
                            ]}
                        >
                            <Octicons name="people" size={20} color={colors.text} />
                            <Text style={{ color: colors.text, marginLeft: 10 }}>Select Members</Text>
                        </Pressable>

                        {/* Publish toggle */}
                        <Pressable
                            onPress={() => setData((prev) => ({ ...prev, published: !prev.published }))}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginVertical: 16,
                            }}
                        >
                            <View
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderWidth: 1,
                                    borderColor: colors.text,
                                    marginRight: 8,
                                    backgroundColor: data.published ? colors.primary : "transparent",
                                }}
                            />
                            <Text style={{ color: colors.text, fontSize: 16 }}>Publish Now</Text>
                        </Pressable>

                        {/* Submit Button */}
                        <Pressable
                            onPress={handleSubmit}
                            style={{marginTop: 24, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', columnGap: 10, justifyContent: 'center'}}
                            disabled={loading}
                        >
                            {loading && <ActivityIndicator color={colors.mainButtonText} />}
                            <Text style={{ color: colors.mainButtonText }}>{loading ? 'Submitting...' : 'Submit'}</Text>
                        </Pressable>
                    </View>
                </ScrollView>

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
                        
                        {membersLoading ?
                            <View style={{ backgroundColor: colors.secondary, flex: 1, width: '90%', maxHeight: 100, alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 20,}}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={{ color: colors.text, marginTop: 10 }}>Loading Members...</Text>
                            </View> :
                            <View style={{
                                width: '90%',
                                maxHeight: '80%',
                                backgroundColor: colors.secondary,
                                borderRadius: 12,
                                padding: 20,
                            }}>
                                {/* Title */}
                                <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text, fontSize: 20 }]}>
                                    Select Members
                                </Text>

                                {/* Select All */}
                                <Pressable
                                    onPress={() => {
                                        if (selectAll) {
                                            setSelectedUsers([]);
                                            setSelectAll(false);
                                        } else {
                                            setSelectedUsers(users.map(user => user._id));
                                            setSelectAll(true);
                                        }
                                    }}
                                    style={[stylesConfig.CARD, {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: colors.border,
                                    }]}
                                >
                                    <View
                                        style={[
                                            stylesConfig.CHECKBOX,
                                            {
                                                borderColor: colors.text,
                                                backgroundColor: selectAll ? colors.primary : 'transparent',
                                            }
                                        ]}
                                    />
                                    <Text style={{ color: colors.text, fontSize: 16 }}>Select All</Text>
                                </Pressable>

                                {/* User List */}
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
                                                style={[
                                                    stylesConfig.CARD,
                                                    {
                                                        backgroundColor: colors.inputBackground,
                                                        borderColor: colors.border,
                                                        marginBottom: 8,
                                                    }
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        stylesConfig.CHECKBOX,
                                                        {
                                                            borderColor: colors.text,
                                                            backgroundColor: isSelected ? colors.primary : 'transparent',
                                                        }
                                                    ]}
                                                />
                                                <Text style={{ color: colors.text }}>{user.fullName}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>

                                {/* Done Button */}
                                <Pressable
                                    onPress={() => setShowMembers(false)}
                                    style={[
                                        stylesConfig.BUTTON,
                                        {
                                            backgroundColor: colors.primary,
                                            marginTop: 20,
                                        }
                                    ]}
                                >
                                    <Text style={{ color: colors.mainButtonText, fontWeight: '600' }}>Done</Text>
                                </Pressable>
                            </View>}
                    </View>
                )}


            </View>
            <Footer />
        </View>
    );
};

export default CreatePayment;
