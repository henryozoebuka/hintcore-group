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
import { useNavigation, useRoute } from '@react-navigation/native';
import Notification from '../../components/Notification/Notification';
import HINTCORELOGO from '../../../assets/images/hintcore-group-logo.png';
import privateAxios from '../../utils/axios/privateAxios';
import Footer from '../../components/Footer/Footer';
import stylesConfig from "../../styles/styles";
import { useAuth } from '../../hooks/useAuth';

export default function UserDashboard() {
  const route = useRoute();
  const successMessage = route.params?.successMessage;
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
    groupImageUrl: '',
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
            fullName: response.data.user.fullName || '',
            groupImageUrl: response.data.group.imageUrl || '',
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

  useEffect(() => {
    if (successMessage) {
      setNotification({ visible: true, type: 'success', message: successMessage });
      setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
    }
  }, [successMessage]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20 }}
      >
        <Notification visible={notification.visible} type={notification.type} message={notification.message} />

        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={dashboardData.groupImageUrl || HINTCORELOGO}
            style={{ width: 80, height: 80, marginBottom: 8 }}
            resizeMode="contain"
          />

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
            Welcome Back{`${dashboardData.fullName ? ',' : ""}`} {dashboardData.fullName}{`${dashboardData.fullName ? '!' : ""}`}
          </Text>
          <Text style={{ fontSize: 16, color: colors.placeholder }}>
            Here’s what’s happening in your groups
          </Text>
        </View>

        {/* Quick Actions */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 25,
          }}
        >
          <Pressable
            style={{
              backgroundColor: colors.secondary,
              padding: 5,
              borderRadius: 12,
              flexDirection: 'row',
              columnGap: 5,
              flexGrow: 1,
              justifyContent: 'center',
              minWidth: '45%', // optional: controls how much space each takes before wrapping
            }}
            onPress={() => navigation.navigate('announcements')}
          >
            <Text>📢</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Announcements</Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: colors.secondary,
              padding: 5,
              borderRadius: 12,
              flexDirection: 'row',
              columnGap: 5,
              flexGrow: 1,
              justifyContent: 'center',
              minWidth: '45%',
            }}
            onPress={() => navigation.navigate('constitutions')}
          >
            <Text>📅</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Constitutions</Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: colors.secondary,
              padding: 5,
              borderRadius: 12,
              flexDirection: 'row',
              columnGap: 5,
              flexGrow: 1,
              justifyContent: 'center',
              minWidth: '45%',
            }}
            onPress={() => navigation.navigate('minutes-records')}
          >
            <Text>💰</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Minutes Records</Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: colors.secondary,
              padding: 5,
              borderRadius: 12,
              flexDirection: 'row',
              columnGap: 5,
              flexGrow: 1,
              justifyContent: 'center',
              minWidth: '45%',
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
              padding: 10,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
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

          {loading ?
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
              <View style={{ flexDirection: 'row', columnGap: 10, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.text }}>Loading the latest announcements...</Text>
              </View>
            </View> :
            dashboardData.announcements.length > 0 ? (
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

      <Footer />
    </View>
  );
}