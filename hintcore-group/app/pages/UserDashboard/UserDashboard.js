import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Notification from '../../components/Notification/Notification';
import HINTCORELOGO from '../../../assets/images/hintcore-group-logo.png';
import privateAxios from '../../utils/axios/privateAxios';
import Footer from '../../components/Footer/Footer';
import stylesConfig from "../../styles/styles";
import { useAuth } from '../../hooks/useAuth';

export default function UserDashboard() {
  const { permissions } = useAuth();
  const navigation = useNavigation();
  const { colors } = useSelector((state) => state.colors);

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    type: '',
    message: '',
  });
  const [dashboardData, setDashboardData] = useState({
    fullName: '',
    announcements: [],
    tasks: [],
    events: [],
    recentActivity: [],
  });

  const truncateTitle = (title) => {
    return title.length > 40 ? title.slice(0, 40) + "..." : title;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const response = await privateAxios.post(`private/user-dashboard`);
        if (response.status === 200) {
          setDashboardData({
            fullName: response.data.fullName || '',
            announcements: response.data.announcements || [],
            tasks: response.data.tasks || [],
            events: response.data.events || [],
            recentActivity: response.data.recentActivity || [],
          });
        }
      } catch (error) {
        console.error('Dashboard Fetch Error:', error);
        setNotification({
          visible: true,
          type: 'error',
          message: error?.response?.data?.message || 'Failed to load dashboard data.',
        });
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

    fetchDashboard();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loading ?
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <View style={{ display: 'flex', }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{color: colors.text}}>Loading your dashboard, please wait...</Text>
          </View>
        </View> :
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 20 }}
        >
          <Notification visible={notification.visible} type={notification.type} message={notification.message} />

          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Image
              source={HINTCORELOGO}
              style={{ width: 80, height: 80, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
              Welcome Back, {dashboardData.fullName}!
            </Text>
            <Text style={{ fontSize: 16, color: colors.placeholder }}>
              Here’s what’s happening in your groups
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 }}>
            <Pressable
              style={{
                backgroundColor: colors.secondary,
                padding: 8,
                marginHorizontal: 6,
                borderRadius: 12,
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('announcements')}
            >
              <Text>📢</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Announcements</Text>
            </Pressable>

            <Pressable
              style={{
                backgroundColor: colors.secondary,
                padding: 8,
                marginHorizontal: 6,
                borderRadius: 12,
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('constitutions')}
            >
              <Text>📅</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Constitutions</Text>
            </Pressable>

            <Pressable
              style={{
                backgroundColor: colors.secondary,
                padding: 8,
                marginHorizontal: 6,
                borderRadius: 12,
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('payments')}
            >
              <Text>💰</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Payments</Text>
            </Pressable>
          </View>

          {/* ✅ Management Dashboard Button */}
          {permissions.includes('admin') && (
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
              dashboardData.announcements.map((item) => (
                <Pressable
                key={item._id}
                  style={[
                    stylesConfig.CARD,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.secondary,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate("announcement", { id: item._id })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "bold" }}>{truncateTitle(item.title)}</Text>
                    {item?.createdAt && <Text style={{ color: colors.text, textAlign: 'right' }}>{moment(item.createdAt).format('MMMM DD, YYYY')}</Text>}
                  </View>
                </Pressable>
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
      }
      <Footer />
    </View>
  );
}