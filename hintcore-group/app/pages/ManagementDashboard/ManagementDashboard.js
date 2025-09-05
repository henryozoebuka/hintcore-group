import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import styles from "../../styles/styles";
import privateAxios from "../../utils/axios/privateAxios";
import Notification from '../../components/Notification/Notification';
import Footer from "../../components/Footer/Footer";

const ManagementDashboard = ({ navigation }) => {
  const { colors } = useSelector((state) => state.colors);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState(null);

  // 2️⃣ Fetch group join code when groupId is available

  const showJoinCode = async () => {
    try {
      setLoading(true);
      const response = await privateAxios.get(`/private/fetch-group-join-code`);
      if (response.status === 200) {
        setJoinCode(response.data.joinCode);
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'No group information found';
      setTimeout(() => {
        setNotification({
          visible: true,
          type: 'error',
          message: errMsg,
        });
      }, 3000);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
        <Notification visible={notification.visible} type={notification.type} message={notification.message} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {joinCode ?
            <View style={{ marginVertical: 20 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>Group Join Code:</Text>
              <Text style={{ color: colors.primary, fontSize: 24 }}>{joinCode}</Text>
            </View> :
            <Pressable onPress={showJoinCode} disabled={loading} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.border }}>
              {loading ?
                <View style={{ flexDirection: 'row', columnGap: 10, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={colors.mainButtonText} />
                  <Text style={{ color: colors.mainButtonText }}>Loading group join code...</Text>
                </View> :
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.mainButtonText }}>Show Group Join Code</Text>
                </View>}
            </Pressable>}
          <Text style={[styles.SETTINGS_STYLES.header, { color: colors.text }]}>
            Quick Actions
          </Text>

          <Pressable onPress={() => navigation.navigate('manage-announcements')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border }} >
            <Text style={{ fontSize: 18, color: colors.text }}>Manage Announcements</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('manage-minutes-records')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border }} >
            <Text style={{ fontSize: 18, color: colors.text }}>Manage Minutes Records</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('manage-constitutions')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border }} >
            <Text style={{ fontSize: 18, color: colors.text }}>Manage Constitutions</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('manage-payments')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border }} >
            <Text style={{ fontSize: 18, color: colors.text }}>Manage Payments</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('manage-users')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border }} >
            <Text style={{ fontSize: 18, color: colors.text }}>Manage Users</Text>
          </Pressable>

        </ScrollView>
      </View>
      <Footer />
    </View>
  );
};

export default ManagementDashboard;