import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const ManageEditProfile = () => {
    const { colors } = useSelector((state) => state.colors);
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params;

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        bio: '',
        gender: 'other',
        imageUrl: '',
        verified: false,
        userRole: '',
    });

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '' });

    useEffect(() => {
        (async () => {
            try {
                const response = await privateAxios.get(`/private/manage-fetch-edit-profile`);
                const {
                    fullName,
                    email,
                    phoneNumber,
                    bio,
                    gender,
                    imageUrl,
                    verified,
                    userRole,
                } = response.data.user;

                setFormData({
                    fullName,
                    email,
                    phoneNumber,
                    bio: bio || '',
                    gender,
                    imageUrl: imageUrl || '',
                    verified,
                    userRole: userRole || '',
                });

            } catch (err) {
                console.error('Load profile error:', err);
                setNotification({ visible: true, type: 'error', message: 'Unable to load profile' });
                setTimeout(() => {
                    setNotification({ visible: false, type: '', message: '' });
                }, 3000);
            } finally {
                setInitialLoading(false);
            }
        })();
    }, []);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = { ...formData };

            const response = await privateAxios.patch(`/private/manage-update-profile/${id}`, payload);

            if (response.status === 200) {
                setNotification({
                    visible: true,
                    type: 'success',
                    message: 'Profile updated successfully',
                });
                setTimeout(() => {
                    setNotification({ visible: false, type: '', message: '' });
                    navigation.navigate('manage-profile', { id });
                }, 3000);
            }

        } catch (err) {
            console.error('Update error:', err);
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Update failed. Try again.';

            setNotification({
                visible: true,
                type: 'error',
                message,
            });

            setTimeout(() => {
                setNotification({ visible: false, type: '', message: '' });
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Notification
                visible={notification.visible}
                type={notification.type}
                message={notification.message}
                onClose={() => setNotification({ visible: false, type: '', message: '' })}
            />

            {initialLoading ? (
                <View style={[stylesConfig.CENTERED_CONTAINER, {
                    backgroundColor: colors.background,
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.text, marginTop: 10 }}>Loading your data...</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{
                        backgroundColor: colors.background,
                        padding: 20,
                        paddingBottom: 10,
                        minHeight: '100%',
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Edit Profile</Text>

                    {/* Full Name */}
                    <View style={{ rowGap: 5 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Full Name</Text>
                        <TextInput
                            style={[stylesConfig.INPUT, {
                                backgroundColor: colors.inputBackground,
                                color: colors.text,
                            }]}
                            placeholder="Full Name"
                            placeholderTextColor={colors.placeholder}
                            value={formData.fullName}
                            onChangeText={(t) => handleChange('fullName', t)}
                        />
                    </View>

                    {/* Email */}
                    <View style={{ rowGap: 5, marginTop: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Email</Text>
                        <TextInput
                            style={[stylesConfig.INPUT, {
                                backgroundColor: colors.inputBackground,
                                color: colors.text,
                            }]}
                            placeholder="Email"
                            placeholderTextColor={colors.placeholder}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(t) => handleChange('email', t)}
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={{ rowGap: 5, marginTop: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Phone Number</Text>
                        <View style={[stylesConfig.INPUT, {
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: colors.inputBackground,
                            paddingHorizontal: 10,
                        }]}>
                            {formData.phoneNumber && <Text style={{ color: colors.text, fontSize: 16, marginRight: 4 }}>+</Text>}
                            <TextInput
                                style={{ flex: 1, color: colors.text, fontSize: 16 }}
                                placeholder="Phone Number"
                                placeholderTextColor={colors.placeholder}
                                keyboardType="phone-pad"
                                value={formData.phoneNumber}
                                onChangeText={(t) => handleChange('phoneNumber', t)}
                            />
                        </View>
                    </View>

                    {/* Bio */}
                    <View style={{ rowGap: 5, marginTop: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Bio</Text>
                        <TextInput
                            style={[stylesConfig.INPUT, {
                                backgroundColor: colors.inputBackground,
                                color: colors.text,
                                height: 200,
                                textAlignVertical: 'top',
                            }]}
                            placeholder="Bio (optional)"
                            placeholderTextColor={colors.placeholder}
                            multiline
                            maxLength={300}
                            value={formData.bio}
                            onChangeText={(t) => handleChange('bio', t)}
                        />
                        <Text style={{ color: colors.placeholder, alignSelf: 'flex-end' }}>
                            {formData.bio.length}/300
                        </Text>
                    </View>

                    {/* Gender */}
                    <View style={{ marginTop: 10 }}>
                        <Text style={{ marginBottom: 8, color: colors.text, fontWeight: '600' }}>Gender</Text>
                        <View style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            backgroundColor: colors.inputBackground,
                            overflow: 'hidden',
                        }}>
                            <Picker
                                selectedValue={formData.gender}
                                onValueChange={(val) => handleChange('gender', val)}
                                style={{ color: colors.text }}
                                dropdownIconColor={colors.text}
                            >
                                <Picker.Item label="Male" value="male" />
                                <Picker.Item label="Female" value="female" />
                                <Picker.Item label="Other" value="other" />
                            </Picker>
                        </View>
                    </View>

                    {/* Image URL */}
                    <View style={{ rowGap: 5, marginTop: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Image URL</Text>
                        <TextInput
                            style={[stylesConfig.INPUT, {
                                backgroundColor: colors.inputBackground,
                                color: colors.text,
                            }]}
                            placeholder="Profile Image URL"
                            placeholderTextColor={colors.placeholder}
                            value={formData.imageUrl}
                            onChangeText={(t) => handleChange('imageUrl', t)}
                        />
                    </View>

                    {/* Verified (Toggle with Picker for simplicity) */}
                    <View style={{ marginTop: 10 }}>
                        <Text style={{ marginBottom: 8, color: colors.text, fontWeight: '600' }}>Verified</Text>
                        <View style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            backgroundColor: colors.inputBackground,
                            overflow: 'hidden',
                        }}>
                            <Picker
                                selectedValue={formData.verified ? 'yes' : 'no'}
                                onValueChange={(val) => handleChange('verified', val === 'yes')}
                                style={{ color: colors.text }}
                                dropdownIconColor={colors.text}
                            >
                                <Picker.Item label="Yes" value="yes" />
                                <Picker.Item label="No" value="no" />
                            </Picker>
                        </View>
                    </View>

                    {/* User Role */}
                    <View style={{ rowGap: 5, marginTop: 10 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>User Role</Text>
                        <View style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            overflow: 'hidden',
                            backgroundColor: colors.inputBackground,
                        }}>
                            <Picker
                                selectedValue={formData.userRole}
                                onValueChange={(val) => handleChange('userRole', val)}
                                style={{ color: colors.text }}
                                dropdownIconColor={colors.text}
                            >
                                <Picker.Item label="User" value="user" />
                                <Picker.Item label="Admin" value="admin" />
                                <Picker.Item label="Moderator" value="moderator" />
                                <Picker.Item label="Super Admin" value="super_admin" />
                            </Picker>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        onPress={handleSubmit}
                        style={[stylesConfig.BUTTON, {
                            backgroundColor: loading ? colors.border : colors.primary,
                            marginTop: 20,
                            flexDirection: 'row',
                            columnGap: 10,
                            justifyContent: 'center',
                        }]}
                        disabled={loading}
                    >
                        {loading && <ActivityIndicator color={colors.mainButtonText} />}
                        <Text style={{ color: colors.mainButtonText, fontWeight: '600' }}>
                            {loading ? 'Updating Profile...' : 'Update Profile'}
                        </Text>
                    </Pressable>
                </ScrollView>
            )}
            <Footer />
        </View>
    );
};

export default ManageEditProfile;
