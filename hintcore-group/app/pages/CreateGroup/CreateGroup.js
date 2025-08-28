import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView
} from 'react-native';
// import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import HONTCOREGROUPLOGO from '../../../assets/images/hintcore-group-logo.png';
import Notification from '../../components/Notification/Notification';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import styles from '../../styles/styles';
import publicAxios from '../../utils/axios/publicAxios';
import PhoneNumberPicker from '../../components/PhoneNumberInput/PhoneNumberInput';

const CreateGroup = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params || {};
  const { colors } = useSelector((state) => state.colors);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [confirmGroupPassword, setConfirmGroupPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [confirmUserPassword, setConfirmUserPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  const [confirmOTP, setConfirmOTP] = useState(routeParams.confirmOTP || false);
  const [userId, setUserId] = useState(routeParams.userId || '');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [confirmVisible, setConfirmVisible] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
  };

  const handleConfirm = async () => {
    if (!otp.trim()) {
      return showNotification('error', 'Please enter the OTP.');
    }

    if (!userId) {
      return showNotification('error', 'Group ID is missing.');
    }

    try {
      setLoading(true);
      const res = await publicAxios.post('/public/confirm-otp', { userId, otp });

      showNotification('success', res.data.message || 'OTP verified successfully.');

      setTimeout(() => navigation.replace('login'), 3000);
    } catch (error) {
      if (error?.response?.status === 400) {
        showNotification(
          'error',
          error.response?.data?.message || 'Failed to confirm OTP. Please try again.'
        );
        setTimeout(() => navigation.replace('login'), 3000);
      }

      console.error('OTP confirmation error:', error.response?.data || error.message);
      showNotification(
        'error',
        error.response?.data?.message || 'Failed to confirm OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!groupName.trim()) return 'Group name is required';
    if (!fullName.trim()) return 'Full name is required';
    if (!email.trim()) return 'Email is required';
    if (!phoneNumber.trim()) return 'Phone number is required';
    if (!groupPassword || !confirmGroupPassword) return 'Group password and confirmation are required';
    if (groupPassword !== confirmGroupPassword) return 'Group passwords do not match';
    if (!userPassword || !confirmUserPassword) return 'User password and confirmation are required';
    if (userPassword !== confirmUserPassword) return 'User passwords do not match';
    return null;
  };

  const handleSubmit = async () => {
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
      const response = await publicAxios.post(
        '/public/create-group',
        {
          groupName,
          description,
          groupPassword,
          fullName,
          userPassword,
          email,
          phoneNumber
        },
      );

      if (response.status === 201) {
        showNotification('success', 'Group and user created successfully!');
        setUserId(response.data.userId);
        showNotification('success', response.data.message);
        setTimeout(() => {
          setConfirmOTP(true);
        }, 3000);
      } else {
        showNotification('error', 'Failed to create group');
      }

    } catch (error) {
      if (error?.response?.status === 409) {
        showNotification(
          'error',
          error.response?.data?.message || 'You already have an account, please login to create a new group.'
        );
        setTimeout(() => navigation.replace('login'), 3000);
      }
      showNotification('error', error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeParams.confirmOTP && routeParams.userId) {
      showNotification('info', 'OTP required. Please check your email.');
    }
  }, []);

  if (confirmOTP) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Notification visible={notification.visible} type={notification.type} message={notification.message} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Image
              source={HONTCOREGROUPLOGO}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 10 }}>
              Confirm OTP
            </Text>
            <Text style={{ color: colors.text, textAlign: 'center', marginTop: 10 }}>
              Please check your email for your OTP. It will expire in 10 minutes.
            </Text>
          </View>

          <TextInput
            style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Enter OTP"
            placeholderTextColor={colors.placeholder}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />

          <Pressable
            style={{
              backgroundColor: loading ? colors.border : colors.primary,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 20
            }}
            onPress={handleConfirm}
            disabled={loading}
          >
            <Text style={{ color: colors.mainButtonText, fontWeight: 'bold', fontSize: 16 }}>
              {loading ? 'Verifying...' : 'Verify'}
            </Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: colors.secondary,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 10
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: colors.buttonText, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{backgroundColor: 'green'}}>
      <Notification visible={notification.visible} type={notification.type} message={notification.message} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={HONTCOREGROUPLOGO}
            style={{ width: 100, height: 100 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 10 }}>
            Create Group
          </Text>
        </View>

        {/* Group Fields */}
        <TextInput
          style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Group Name"
          placeholderTextColor={colors.placeholder}
          value={groupName}
          onChangeText={setGroupName}
        />
        <TextInput
          style={[styles.INPUT, { height: 80, backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Group description (optional)"
          placeholderTextColor={colors.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Group Secret Code"
          placeholderTextColor={colors.placeholder}
          value={groupPassword}
          secureTextEntry
          onChangeText={setGroupPassword}
        />
        <TextInput
          style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Confirm Group Secret Code"
          placeholderTextColor={colors.placeholder}
          value={confirmGroupPassword}
          secureTextEntry
          onChangeText={setConfirmGroupPassword}
        />

        {/* User Fields */}
        <TextInput
          style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Your Full Name"
          placeholderTextColor={colors.placeholder}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
        />

        <PhoneNumberPicker
          value={phoneNumber}
          onChange={(num) => {
            let cleanNumber = num.trim();

            // Remove all spaces or non-digit characters
            cleanNumber = cleanNumber.replace(/\D/g, '');

            // Remove ALL leading zeros
            cleanNumber = cleanNumber.replace(/^0+/, '');

            // Pass clean number to backend as-is — PhoneNumberPicker already gives full country code
            setPhoneNumber(cleanNumber);
          }}
        />

        <TextInput
          style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="User Password"
          placeholderTextColor={colors.placeholder}
          value={userPassword}
          secureTextEntry
          onChangeText={setUserPassword}
        />
        <TextInput
          style={[styles.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Confirm User Password"
          placeholderTextColor={colors.placeholder}
          value={confirmUserPassword}
          secureTextEntry
          onChangeText={setConfirmUserPassword}
        />

        {/* Create Button */}
        <Pressable
          style={{
            backgroundColor: loading ? colors.border : colors.primary,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 20
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
            marginTop: 10
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.buttonText, fontWeight: '600' }}>Cancel</Text>
        </Pressable>
      </ScrollView>


      <ConfirmDialog
        visible={confirmVisible}
        title="Confirm Group Creation"
        message="Are you sure you want to create this group and user?"
        onConfirm={confirmCreateGroup}
        onCancel={() => setConfirmVisible(false)}
      />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default CreateGroup;