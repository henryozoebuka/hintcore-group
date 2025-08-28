import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import PhoneNumberPicker from '../../components/PhoneNumberInput/PhoneNumberInput';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import HONTCOREGROUPLOGO from '../../../assets/images/hintcore-group-logo.png';
import Notification from '../../components/Notification/Notification';
import publicAxios from '../../utils/axios/publicAxios';

const JoinGroup = () => {
  const navigation = useNavigation();
  const { colors } = useSelector((state) => state.colors);

  // Section 1 states
  const [joinCode, setJoinCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupPassword, setGroupPassword] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // Section 2 states (user info)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    type: '',
    message: '',
  });

  const handleVerifyGroup = async () => {
    if (!joinCode.trim() || !groupPassword.trim()) {
      setNotification({
        visible: true,
        type: 'error',
        message: 'Please enter both join code and group password.',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await publicAxios.post(`/public/verify-group`, { joinCode, groupPassword });
      if (response.status === 200) {
        setGroupName(response.data.groupName);

        setNotification({
          visible: true,
          type: 'success',
          message: response.data.message || 'Group verified. Please complete your registration.',
        });

      }

      setTimeout(() => {
        setVerified(true);

        setNotification({
          visible: false,
          type: '',
          message: '',
        });

        setLoading(false);
      }, 2000);
    } catch (error) {
      
      if (error?.response?.data) {
        setNotification({
        visible: true,
        type: 'error',
        message: error.response.data.message || 'Invalid join code or password.',
      });
      }

      setTimeout(() => {
        setNotification({
          visible: false,
          type: '',
          message: '',
        });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !userPassword || !confirmPassword) {
      setNotification({
        visible: true,
        type: 'error',
        message: 'Please fill all fields.',
      });
      return;
    }

    if (userPassword !== confirmPassword) {
      setNotification({
        visible: true,
        type: 'error',
        message: 'Passwords do not match.',
      });
      return;
    }

    try {
      setLoading(true);

      const response = await publicAxios.post('/public/join-group', {
        joinCode, fullName, email, phoneNumber, password: userPassword
      });

      if (response.status === 201) {
        setNotification({
          visible: true,
          type: 'success',
          message: 'You have successfully joined the group!',
        });

        setTimeout(() => {
          navigation.navigate('create-group', {
            confirmOTP: true,
            userId: response.data.userId,
          });
        }, 3000);
      }

      if (response.status === 202) {
        setNotification({
          visible: true,
          type: 'error',
          message: response.data.message || 'You are already a member of this group, login to join a group!',
        });

        setTimeout(() => {
          navigation.navigate('login');
        }, 4000);
      }

    } catch (error) {
      
      if (error?.response?.data) {
        setNotification({
        visible: true,
        type: 'error',
        message: error.response.data.message || 'Something went wrong during registration.',
      });
      }
      
      setTimeout(() => {
        setNotification({
        visible: false,
        type: '',
        message: '',
      });
      }, 3000);

      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Notification */}
      <Notification
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 60,
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <Image
            source={HONTCOREGROUPLOGO}
            style={{ width: 100, height: 100, marginBottom: 16 }}
            resizeMode="contain"
          />

          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
            {groupName}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              opacity: 0.7,
              marginBottom: 32,
            }}
          >
            {verified ? 'Complete your registration' : 'Join an existing group'}
          </Text>

          {/* SECTION 1: Group Verification */}
          {!verified && (
            <>
              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="Enter group code"
                placeholderTextColor={colors.placeholder}
                value={joinCode}
                onChangeText={setJoinCode}
              />

              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="Enter group password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={groupPassword}
                onChangeText={setGroupPassword}
              />

              <Pressable
                style={{
                  backgroundColor: loading ? colors.border : colors.primary,
                  paddingVertical: 14,
                  borderRadius: 10,
                  width: '100%',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
                onPress={handleVerifyGroup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.mainButtonText} />
                ) : (
                  <Text
                    style={{
                      color: colors.mainButtonText,
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}
                  >
                    Verify Group
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {/* SECTION 2: User Registration */}
          {verified && (
            <>

              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="Full Name"
                placeholderTextColor={colors.placeholder}
                value={fullName}
                onChangeText={setFullName}
              />

              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="Email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <PhoneNumberPicker
                value={phoneNumber}
                onChange={(num) => {
                  let cleanNumber = num.trim();

                  // Remove all non-digit characters
                  cleanNumber = cleanNumber.replace(/\D/g, '');

                  // Remove ALL leading zeros
                  cleanNumber = cleanNumber.replace(/^0+/, '');

                  // Pass clean number to backend as-is — PhoneNumberPicker already includes country code
                  setPhoneNumber(cleanNumber);
                }}
              />

              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 16,
                  marginTop: 10,
                  marginBottom: 16,
                }}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={userPassword}
                onChangeText={setUserPassword}
              />

              <TextInput
                style={{
                  width: '100%',
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  padding: 14,
                  borderRadius: 10,
                  fontSize: 16,
                  marginBottom: 16,
                }}
                placeholder="Confirm Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Pressable
                style={{
                  backgroundColor: loading ? colors.border : colors.primary,
                  paddingVertical: 14,
                  borderRadius: 10,
                  width: '100%',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
                onPress={handleCompleteRegistration}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.mainButtonText} />
                ) : (
                  <Text
                    style={{
                      color: colors.mainButtonText,
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}
                  >
                    Complete Registration
                  </Text>
                )}
              </Pressable>
            </>
          )}

          {/* Cancel Button */}
          <View style={{ width: '100%', marginTop: 10 }}>
            <Pressable
              style={{
                backgroundColor: colors.secondary,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: colors.buttonText, fontWeight: '600' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default JoinGroup;