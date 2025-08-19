import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Notification from '../../components/Notification/Notification';
import HONTCOREGROUPLOGO from '../../../assets/images/hintcore-group-logo.png';
import publicAxios from '../../utils/axios/publicAxios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setIsLoggedIn } from '../../redux/slices/authSlice';


export default function Login() {
  const navigation = useNavigation();
  const { colors } = useSelector((state) => state.colors);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  
  const handleLogin = async () => {
  try {
    setLoading(true);
    const response = await publicAxios.post('/public/login', { email, password });

    if (response.status === 200) {
      const { user, token } = response.data;

      // Store token and userId in AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', user.userId);
      await AsyncStorage.setItem('currentGroupId', user.currentGroupId);
      await AsyncStorage.setItem('groupName', user.groupName);
      await AsyncStorage.setItem('permissions', JSON.stringify(user.permissions));

      // ✅ Update Redux auth state
      dispatch(setIsLoggedIn(true));

      setNotification({
        visible: true,
        type: 'success',
        message: response.data.message || 'Login successful.',
      });

      // ✅ Redirect to main app (let RootNavigator handle the stack based on isLoggedIn)
    }

    if (response.status === 202) {
      setNotification({
        visible: true,
        type: 'error',
        message: response.data.message || 'Please confirm your OTP to continue.',
      });

      setTimeout(() => {
        navigation.navigate('create-group', {
          confirmOTP: true,
          userId: response.data.userId,
        });
      }, 3000);
    }

  } catch (error) {
    if (error?.response?.status === 400) {
      setNotification({
        visible: true,
        type: 'error',
        message: error.response?.data?.message || 'Failed to confirm OTP. Please try again.',
      });
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

  const handleSettings = () => {
    navigation.navigate('settings');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View>
        {loading && <ActivityIndicator />}
      </View>
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
              marginBottom: 20
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={{ color: colors.mainButtonText, fontSize: 16, fontWeight: 'bold' }}>
              {loading ? <ActivityIndicator color={'#FFFFFF'} /> : 'Login'}
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

            <Pressable
              style={{
                flex: 1,
                backgroundColor: colors.secondary,
                paddingVertical: 12,
                borderRadius: 10,
                marginHorizontal: 5,
                alignItems: 'center'
              }}
              onPress={handleSettings}
            >
              <Text style={{ color: colors.buttonText, fontWeight: '600' }}>Settings</Text>
            </Pressable>
          </View>

          {/* Forgot Password */}
          <Pressable onPress={() => navigation.navigate('register')}>
            <Text style={{ fontSize: 14, color: colors.primary }}>Forgot Password?</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}