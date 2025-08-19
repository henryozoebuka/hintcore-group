// pages/Profile/Profile.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import USERIMAGEALT from '../../../assets/images/hintcore-group-logo.png';
import { useNavigation } from '@react-navigation/native';
export default function Profile() {
  const { colors } = useSelector((state) => state.colors);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [profile, setProfile] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('token');

        if (!userId || !token) {
          setNotification({
            visible: true,
            type: 'error',
            message: 'User not logged in',
          });
          
          navigation.navigate('login')
          setLoading(false);
          return;
        }
        
        const response = await privateAxios.get(`/private/user-profile/${userId}`);

        if (response.status === 200) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        setNotification({
          visible: true,
          type: 'error',
          message: error?.response?.data?.message || 'Failed to fetch profile',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Notification visible={notification.visible} type={notification.type} message={notification.message} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <Notification visible={notification.visible} type={notification.type} message={notification.message} />

      <View style={{ alignItems: 'center', paddingVertical: 30 }}>
        <Image
          source={profile.imageUrl ? { uri: profile.imageUrl } : USERIMAGEALT}
          style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 16 }}
        />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>{profile.fullName}</Text>
        <Text style={{ fontSize: 16, color: colors.placeholder }}>{profile.email}</Text>
        <Text style={{ fontSize: 16, color: colors.placeholder }}>{profile.phoneNumber}</Text>
      </View>

      <Pressable onPress={() => navigation.navigate('user-dashboard')}>
        <Text>User Dashboard</Text>
      </Pressable>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Bio */}
        {profile.bio ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 5 }}>Bio</Text>
            <Text style={{ fontSize: 16, color: colors.text, marginBottom: 20 }}>{profile.bio}</Text>
          </>
        ) : null}

        {/* Gender */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 5 }}>Gender</Text>
        <Text style={{ fontSize: 16, color: colors.text, marginBottom: 20 }}>{profile.gender}</Text>

        {/* Groups */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>Groups</Text>
        {profile.groups && profile.groups.length > 0 ? (
          profile.groups.map((g, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.secondary,
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{g.name}</Text>
              <Text style={{ fontSize: 14, color: colors.placeholder }}>{g.description}</Text>
              <Text style={{ fontSize: 14, color: colors.placeholder }}>Status: {g.status}</Text>
              {g.permissions.length > 0 && (
                <Text style={{ fontSize: 14, color: colors.placeholder }}>
                  Permissions: {g.permissions.join(', ')}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 14, color: colors.placeholder }}>No groups joined yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
