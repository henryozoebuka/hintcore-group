import React, { useState } from 'react';
import {
    View,
    ScrollView,
    Text,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Image,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import HONTCOREGROUPLOGO from '../../../assets/images/hintcore-group-logo.png';
import Notification from '../../components/Notification/Notification';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import styles from '../../styles/styles';
import privateAxios from '../../utils/axios/privateAxios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateAnotherGroup = () => {
    const navigation = useNavigation();
    const { colors } = useSelector((state) => state.colors);

    // state
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [groupPassword, setGroupPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
    const [confirmVisible, setConfirmVisible] = useState(false);

    const showNotification = (type, message) => {
        setNotification({ visible: true, type, message });
        setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
    };

    const validateForm = () => {
        if (!groupName.trim()) return 'Group name is required';
        if (!groupPassword.trim()) return 'Group password is required';
        return null;
    };

    const handleSubmit = () => {
        const error = validateForm();
        if (error) {
            showNotification('error', error);
            return;
        }
        setConfirmVisible(true);
    };

    const confirmCreateGroup = async () => {
        try {
            setLoading(true);
            setConfirmVisible(false);

            const response = await privateAxios.post('/private/create-another-group', {
                groupName,
                description,
                groupPassword,
            });

            if (response.status === 201) {
                const { message, token, groupName: serverGroupName, currentGroupId } = response.data;

                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('groupName', serverGroupName);
                await AsyncStorage.setItem('currentGroupId', currentGroupId);

                setGroupName('');
                setDescription('');
                setGroupPassword('');
                navigation.navigate('user-dashboard', {
                    successMessage: message || 'Group created successfully!',
                });
            }
            else {
                showNotification('error', 'Failed to create group');
            }
        } catch (error) {
            showNotification(
                'error',
                error?.response?.data?.message || 'Failed to create group'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaView>
                <Notification visible={notification.visible} type={notification.type} message={notification.message} />
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <Image
                            source={HONTCOREGROUPLOGO}
                            style={{ width: 100, height: 100 }}
                            resizeMode="contain"
                        />
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 10 }}>
                            Create Another Group
                        </Text>
                    </View>

                    {/* Group Name */}
                    <TextInput
                        style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                        placeholder="Group Name"
                        placeholderTextColor={colors.placeholder}
                        value={groupName}
                        onChangeText={setGroupName}
                    />

                    {/* Description */}
                    <TextInput
                        style={[styles.INPUT, { height: 80, backgroundColor: colors.inputBackground, color: colors.text }]}
                        placeholder="Group Description (optional)"
                        placeholderTextColor={colors.placeholder}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />

                    {/* Group Password */}
                    <TextInput
                        style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                        placeholder="Group Secret Code"
                        placeholderTextColor={colors.placeholder}
                        value={groupPassword}
                        onChangeText={setGroupPassword}
                        secureTextEntry
                    />

                    {/* Create Button */}
                    <Pressable
                        style={{
                            backgroundColor: loading ? colors.border : colors.primary,
                            paddingVertical: 14,
                            borderRadius: 10,
                            alignItems: 'center',
                            marginTop: 20,
                        }}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={{ color: colors.mainButtonText, fontWeight: 'bold', fontSize: 16 }}>
                            {loading ? 'Creating...' : 'Create Group'}
                        </Text>
                    </Pressable>

                    {/* Cancel Button */}
                    <Pressable
                        style={{
                            backgroundColor: colors.secondary,
                            paddingVertical: 12,
                            borderRadius: 10,
                            alignItems: 'center',
                            marginTop: 10,
                        }}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={{ color: colors.buttonText, fontWeight: '600' }}>Cancel</Text>
                    </Pressable>
                </ScrollView>

                {/* Confirm Dialog */}
                <ConfirmDialog
                    visible={confirmVisible}
                    title="Confirm Group Creation"
                    message={`Are you sure you want to create "${groupName}"?`}
                    onConfirm={confirmCreateGroup}
                    onCancel={() => setConfirmVisible(false)}
                />
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

export default CreateAnotherGroup;