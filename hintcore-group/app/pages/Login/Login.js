import React, { useState } from 'react';
import { 
  View, Text, TextInput, Pressable, Image, 
  KeyboardAvoidingView, Platform, ScrollView, 
  ActivityIndicator, Keyboard 
} from 'react-native';
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
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();

  const showNotification = (type, message, duration = 3000) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => {
      setNotification({ visible: false, type: '', message: '' });
    }, duration);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email || !password) {
      showNotification('error', 'Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const response = await publicAxios.post('/public/login', { email, password });

      if (response.status === 200) {
        const { groupName, token } = response.data;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('groupName', groupName);

        dispatch(setIsLoggedIn(true));

        showNotification('success', response.data.message || 'Login successful.', 2000);
      }

      if (response.status === 202) {
        showNotification('error', response.data.message || 'Please confirm your OTP to continue.', 2000);

        setTimeout(() => {
          navigation.navigate('create-group', {
            confirmOTP: true,
            userId: response.data.userId,
          });
        }, 2000);
      }

    } catch (error) {
      if (error.response) {
        showNotification('error', error.response?.data?.message || 'Failed to login. Please try again.');
      } else if (error.request) {
        showNotification('error', 'Network error. Please check your connection.');
      } else {
        showNotification('error', 'An unexpected error occurred.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('create-group');
  };

  const handleJoinGroup = () => {
    navigation.navigate('join-group');
  };

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
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password */}
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
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Login Button */}
          <Pressable
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
          <Pressable onPress={() => navigation.navigate('forgot-password')}>
            <Text style={{ fontSize: 14, color: colors.primary }}>Forgot Password?</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;