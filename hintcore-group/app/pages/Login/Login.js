import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, Image,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Keyboard
} from 'react-native';
import registerForPushNotificationsAsync from "../../utils/notifications/registerForPushNotifications";
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Notification from '../../components/Notification/Notification';
import HONTCOREGROUPLOGO from '../../../assets/images/hintcore-group-logo.png';
import publicAxios from '../../utils/axios/publicAxios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setIsLoggedIn } from '../../redux/slices/authSlice';

const Login = () => {
  const navigation = useNavigation();
  const { colors } = useSelector((state) => state.colors);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [confirmOTP, setConfirmOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [otpTime, setOtpTime] = useState(0);
  const [expiryTime, setExpiryTime] = useState(null);

  const dispatch = useDispatch();

  const showNotification = (type, message, duration = 3000) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => {
      setNotification({ visible: false, type: '', message: '' });
    }, duration);
  };

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return strongRegex.test(password);
  };

  const resetAllFields = () => {
    setPassword('');
    setOtp('');
    setResetPassword('');
    setConfirmResetPassword('');
  };

  const showLogin = () => {
    setConfirmOTP(false);
    setForgotPassword(false);
    resetAllFields();
  }

  const showForgotPassword = () => {
    setConfirmOTP(false);
    setForgotPassword(true);
    resetAllFields();
  }

  const showConfirmOTP = () => {
    setForgotPassword(false);
    setConfirmOTP(true);
    resetAllFields();
  }

  const handleLogin = async () => {
    if (loading) return;
  Keyboard.dismiss();

  if (!email || !password) {
    showNotification('error', 'Please enter both email and password.');
    return;
  }

  try {
    setLoading(true);

    // ✅ Get push token before login request
    const deviceToken = await registerForPushNotificationsAsync();

    const response = await publicAxios.post('/public/login', {
      email: email.trim(),
      password,
      deviceToken, // ✅ attach push token here
    });

    if (response.status === 200) {
      const { groupName, token } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('groupName', groupName);

      dispatch(setIsLoggedIn(true));
      showNotification('success', response.data.message || 'Login successful.', 2000);
    }

    } catch (error) {
      if (error?.response?.status === 409) {
        await AsyncStorage.setItem('otpToken', error.response.data.otpToken);
        showConfirmOTP();
      }
      if (error.response) {
        showNotification('error', error.response?.data?.message || 'Failed to login. Please try again.');
      } else if (error.request) {
        showNotification('error', 'Network error. Please check your connection.');
      } else {
        showNotification('error', 'An unexpected error occurred.');
      }
      if (__DEV__) {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (loading) return;
    Keyboard.dismiss();

    if (!email) {
      showNotification('error', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const response = await publicAxios.post('/public/forgot-password', { email });

      if (response.status === 200) {
        await AsyncStorage.setItem('otpToken', response.data.token);

        const durationInSeconds = response.data.otpTime * 60;
        setExpiryTime(Date.now() + durationInSeconds * 1000); // store expiry timestamp

        showLogin();

        showNotification(
          'success',
          response.data.message || 'Password reset link sent to your email.'
        );

        showConfirmOTP();
      } else {
        showNotification(
          'error',
          response.data.message || 'Something went wrong. Please try again.'
        );
      }
    } catch (error) {
      if (error.response) {
        showNotification(
          'error',
          error.response?.data?.message || 'Unable to send reset link.'
        );
      } else if (error.request) {
        showNotification('error', 'Network error. Please check your connection.');
      } else {
        showNotification('error', 'An unexpected error occurred.');
      }
      if (__DEV__) {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOTP = async () => {
    if (loading) return;

    if (otpTime === 0) {
      showNotification('error', 'OTP has expired. Please request a new one.');
      return;
    }

    if (!isStrongPassword(resetPassword)) {
      showNotification(
        'error',
        'Password must include uppercase, lowercase, number, and special character.'
      );
      return;
    }
    Keyboard.dismiss();

    const otpToken = await AsyncStorage.getItem('otpToken')

    if (!otpToken || !resetPassword || !confirmResetPassword) {
      showNotification('error', 'Please fill in all fields.');
      return;
    }

    if (resetPassword !== confirmResetPassword) {
      showNotification('error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const response = await publicAxios.post(
        '/public/confirm-otp-for-reset-password',
        { otp, password: resetPassword },
        {
          headers: {
            'Authorization': `Bearer ${otpToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        showNotification('success', response.data.message || 'Password updated successfully.');
        resetAllFields();
        setExpiryTime(null);
        setOtpTime(0);

        setTimeout(() => {
          showLogin();
        }, 2000);

      } else {
        showNotification('error', response.data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 410) {
          showForgotPassword();
        }

        if (status === 404 || status === 429) {
          showLogin();
        }

        showNotification('error', data?.message || 'OTP confirmation failed.');
      } else if (error.request) {
        showNotification('error', 'Network error. Please check your connection.');
      } else {
        showNotification('error', 'An unexpected error occurred.');
      }

      if (__DEV__) {
        console.error(error);
      }
    }
    finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('create-group');
  };

  const handleJoinGroup = () => {
    navigation.navigate('join-group');
  };

  useEffect(() => {
    let interval;

    if (expiryTime) {
      interval = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.floor((expiryTime - Date.now()) / 1000)
        );
        setOtpTime(remaining);
        if (remaining === 0) clearInterval(interval);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [expiryTime]);

  if (forgotPassword) {

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Notification visible={notification.visible} type={notification.type} message={notification.message} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' }}>
            {/* Logo */}
            <Image
              source={HONTCOREGROUPLOGO}
              style={{ width: 100, height: 100, marginBottom: 16 }}
              resizeMode="contain"
            />

            {/* Title */}
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
              Hintcore Group
            </Text>
            <Text style={{ fontSize: 16, color: colors.placeholder, marginBottom: 32 }}>
              Reset Your Password
            </Text>

            {/* Email Input */}
            <TextInput
              style={{
                width: '100%',
                backgroundColor: colors.inputBackground,
                padding: 14,
                borderRadius: 10,
                fontSize: 16,
                marginBottom: 16,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border
              }}
              accessibilityLabel="Enter your email address"
              placeholder="Enter your email address"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Submit Button */}
            <Pressable
              accessibilityLabel="Submit OTP button"
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 10,
                width: '100%',
                alignItems: 'center',
                marginBottom: 20,
                flexDirection: 'row',
                columnGap: 10,
                justifyContent: 'center'
              }}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading && <ActivityIndicator color={colors.mainButtonText} />}
              <Text style={{ color: colors.mainButtonText }}>
                {loading ? 'Sending Reset OTP...' : 'Send Reset OTP'}
              </Text>
            </Pressable>

            {/* Back to Login */}
            <Pressable accessibilityLabel="Back to login" onPress={showLogin}>
              <Text style={{ fontSize: 14, color: colors.primary }}>Back to Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (confirmOTP) {

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Notification visible={notification.visible} type={notification.type} message={notification.message} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' }}>
            <Image
              source={HONTCOREGROUPLOGO}
              style={{ width: 100, height: 100, marginBottom: 16 }}
              resizeMode="contain"
            />

            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
              Hintcore Group
            </Text>
            <Text style={{ fontSize: 16, color: colors.placeholder, marginBottom: 32 }}>
              Confirm OTP and Set New Password
            </Text>

            <Text style={{ fontSize: 16, color: colors.placeholder, marginBottom: 32 }}>
              {otpTime > 0
                ? `OTP expires in ${Math.floor(otpTime / 60)}:${(otpTime % 60).toString().padStart(2, '0')} minutes`
                : 'OTP has expired. Please request a new one.'}
            </Text>

            {/* OTP Input */}
            <TextInput
              editable={otpTime > 0}
              style={{
                opacity: otpTime === 0 ? 0.6 : 1,
                width: '100%',
                backgroundColor: colors.inputBackground,
                padding: 14,
                borderRadius: 10,
                fontSize: 16,
                marginBottom: 16,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
                letterSpacing: 4
              }}
              accessibilityLabel="Enter OTP code"
              placeholder="Enter OTP code"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />

            {/* New Password */}
            <TextInput
              editable={otpTime > 0}
              style={{
                opacity: otpTime === 0 ? 0.6 : 1,
                width: '100%',
                backgroundColor: colors.inputBackground,
                padding: 14,
                borderRadius: 10,
                fontSize: 16,
                marginBottom: 16,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border
              }}
              accessibilityLabel="New password"
              placeholder="New Password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={resetPassword}
              onChangeText={setResetPassword}
            />

            {/* Confirm Password */}
            <TextInput
              editable={otpTime > 0}
              style={{
                opacity: otpTime === 0 ? 0.6 : 1,
                width: '100%',
                backgroundColor: colors.inputBackground,
                padding: 14,
                borderRadius: 10,
                fontSize: 16,
                marginBottom: 16,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border
              }}
              accessibilityLabel="Confirm password"
              placeholder="Confirm Password"
              placeholderTextColor={colors.placeholder}
              secureTextEntry
              value={confirmResetPassword}
              onChangeText={setConfirmResetPassword}
            />

            {/* Confirm OTP Button */}
            {otpTime === 0 ? (<Pressable
              accessibilityLabel="Request new OTP"
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 10,
                width: '100%',
                alignItems: 'center',
                marginBottom: 20,
                flexDirection: 'row',
                columnGap: 10,
                justifyContent: 'center'
              }}
              onPress={showForgotPassword}>
              <Text style={{ color: colors.mainButtonText }}>Request New OTP</Text>
            </Pressable>) :
              (<Pressable
                accessibilityLabel="Confirm OTP"
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 10,
                  width: '100%',
                  alignItems: 'center',
                  marginBottom: 20,
                  flexDirection: 'row',
                  columnGap: 10,
                  justifyContent: 'center'
                }}
                onPress={handleConfirmOTP}
                disabled={loading}
              >
                {loading && <ActivityIndicator color={colors.mainButtonText} />}
                <Text style={{ color: colors.mainButtonText }}>
                  {loading ? 'Verifying...' : 'Confirm OTP'}
                </Text>
              </Pressable>)
            }

            {/* Back to Login */}
            <Pressable accessibilityLabel="Back to login" onPress={() => { showLogin(); setLoading(false) }}>
              <Text style={{ fontSize: 14, color: colors.primary }}>Back to Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Notification visible={notification.visible} type={notification.type} message={notification.message} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' }}>
          {/* Logo */}
          <Image
            source={HONTCOREGROUPLOGO}
            style={{ width: 100, height: 100, marginBottom: 16 }}
            resizeMode="contain"
          />

          {/* App Name */}
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.text }}>
            Hintcore Group
          </Text>
          <Text style={{ fontSize: 16, color: colors.placeholder, marginBottom: 32 }}>
            Sign in to continue
          </Text>

          {/* Email */}
          <TextInput
            style={{
              width: '100%',
              backgroundColor: colors.inputBackground,
              padding: 14,
              borderRadius: 10,
              fontSize: 16,
              marginBottom: 16,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border
            }}
            accessibilityLabel="Email"
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password */}
          <View style={{ width: '100%', marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.inputBackground,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.text
                }}
                accessibilityLabel="Password"
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable accessibilityLabel="Hide or show password" onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            accessibilityLabel="Login button"
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 10,
              width: '100%',
              alignItems: 'center',
              marginBottom: 20,
              flexDirection: 'row',
              columnGap: 10,
              justifyContent: 'center'
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading && <ActivityIndicator color={colors.mainButtonText} />}
            <Text style={{ color: colors.mainButtonText }}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </Pressable>

          {/* Create / Join Group */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: 30
            }}
          >
            <Pressable
              accessibilityLabel="Create a group"
              style={{
                flex: 1,
                backgroundColor: colors.secondary,
                paddingVertical: 12,
                borderRadius: 10,
                marginHorizontal: 5,
                alignItems: 'center'
              }}
              onPress={handleCreateGroup}
            >
              <Text style={{ color: colors.buttonText, fontWeight: '600' }}>Create a Group</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Join a group"
              style={{
                flex: 1,
                backgroundColor: colors.secondary,
                paddingVertical: 12,
                borderRadius: 10,
                marginHorizontal: 5,
                alignItems: 'center'
              }}
              onPress={handleJoinGroup}
            >
              <Text style={{ color: colors.buttonText, fontWeight: '600' }}>Join a Group</Text>
            </Pressable>
          </View>

          {/* Forgot Password */}
          <Pressable accessibilityLabel="Forgot password?" onPress={showForgotPassword}>
            <Text style={{ fontSize: 14, color: colors.primary }}>Forgot Password?</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;