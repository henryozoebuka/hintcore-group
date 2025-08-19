// pages/UserDashboard/UserDashboard.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Notification from '../../components/Notification/Notification';
import HINTCORELOGO from '../../../assets/images/hintcore-group-logo.png';
import privateAxios from '../../utils/axios/privateAxios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserDashboard() {
  const navigation = useNavigation();
  const { colors } = useSelector((state) => state.colors);
  const { userId } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    type: '',
    message: '',
  });
  const [dashboardData, setDashboardData] = useState({
    announcements: [],
    tasks: [],
    events: [],
    recentActivity: [],
  });

  useEffect(() => {
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      // 🟢 FIX: Properly parse permissions array
      const permissionsString = await AsyncStorage.getItem('permissions');
      const parsedPermissions = permissionsString ? JSON.parse(permissionsString) : [];
      setPermissions(parsedPermissions);

      const response = await privateAxios.get(`private/user-dashboard/${userId}`);
      if (response.status === 200) {
        console.log(response.data);
        // setDashboardData(response.data);
      }
    } catch (error) {
      if (error?.response?.status) {
        setNotification({
          visible: true,
          type: 'error',
          message: error.response?.data?.message || 'Failed to load dashboard data.',
        });
        setTimeout(() => {
          setNotification({
            visible: false,
            type: 'error',
            message: '',
          });
        }, 3000);
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchDashboard();
}, [userId]);


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ✅ Check if user has any management permission
  const hasManagementPermission = permissions.some((perm) =>
    [
      'admin',
      'manage_announcements',
      'manage_events',
      'manage_constitution',
      'manage_finance',
    ].includes(perm)
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Notification
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
      />

      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Image
          source={HINTCORELOGO}
          style={{ width: 80, height: 80, marginBottom: 8 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
          Welcome Back!
        </Text>
        <Text style={{ fontSize: 16, color: colors.placeholder }}>
          Here’s what’s happening in your groups
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.secondary,
            padding: 16,
            marginHorizontal: 6,
            borderRadius: 12,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('Announcements')}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>📢 Announcements</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.secondary,
            padding: 16,
            marginHorizontal: 6,
            borderRadius: 12,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('Events')}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>📅 Events</Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            backgroundColor: colors.secondary,
            padding: 16,
            marginHorizontal: 6,
            borderRadius: 12,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('Finance')}
        >
          <Text style={{ color: colors.text, fontWeight: '600' }}>💰 Finance</Text>
        </Pressable>
      </View>

      {/* ✅ Management Dashboard Button */}
      {hasManagementPermission && (
        <Pressable
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 25,
          }}
          onPress={() => navigation.navigate('management-dashboard')}
        >
          <Text style={{ color: colors.mainButtonText, fontWeight: '700', fontSize: 16 }}>
            ⚙️ Management Dashboard
          </Text>
        </Pressable>
      )}

      {/* Announcements */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
          Latest Announcements
        </Text>
        {dashboardData.announcements.length > 0 ? (
          dashboardData.announcements.map((item, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.inputBackground,
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>{item.title}</Text>
              <Text style={{ color: colors.placeholder }}>{item.summary}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.placeholder }}>No announcements available.</Text>
        )}
      </View>

      {/* Upcoming Events */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
          Upcoming Events
        </Text>
        {dashboardData.events.length > 0 ? (
          dashboardData.events.map((event, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.inputBackground,
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>{event.name}</Text>
              <Text style={{ color: colors.placeholder }}>{event.date}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.placeholder }}>No upcoming events.</Text>
        )}
      </View>

      {/* Recent Activity */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>
          Recent Activity
        </Text>
        {dashboardData.recentActivity.length > 0 ? (
          dashboardData.recentActivity.map((activity, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.inputBackground,
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: colors.text }}>{activity.description}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.placeholder }}>No recent activity.</Text>
        )}
      </View>
    </ScrollView>
  );
}