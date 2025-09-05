import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { setDarkMode, setLightMode } from '../../redux/slices/colorsSlice';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

export default function Settings() {
  const { colors, theme } = useSelector((state) => state.colors);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [memberNumberLoading, setMemberNumberLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [memberNumber, setMemberNumber] = useState(null);
  const [memberNumberShown, setMemberNumberShown] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingChangingGroup, setLoadingChangingGroup] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: '',
    message: '',
  });

  useEffect(() => {
    const loadUserIdAndTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');

      if (savedTheme === 'dark') {
        dispatch(setDarkMode());
      } else {
        dispatch(setLightMode());
      }
    };

    loadUserIdAndTheme();
  }, [dispatch]);

  const toggleTheme = async () => {
    if (theme === 'light') {
      dispatch(setDarkMode());
      await AsyncStorage.setItem('theme', 'dark');
    } else {
      dispatch(setLightMode());
      await AsyncStorage.setItem('theme', 'light');
    }
  };

  const showMemberNumber = async () => {
    try {
      setMemberNumberLoading(true);
      const response = await privateAxios.get("/private/show-member-number");
      if (response.status === 200) {
        setMemberNumber(response.data.memberNumber);
        setMemberNumberShown(true);
      }
    } catch (error) {
      console.error("Error fetching member number: ", error)
      if (error?.response?.data?.message) {
        setNotification({ visible: true, type: "error", message: error.response.data.message });
        setTimeout(() => {
          setNotification({ visible: false, type: "", message: "" });
        }, 3000);
      }
    } finally {
      setMemberNumberLoading(false)
    }
  }

  const handleChangeGroup = async (id) => {
    try {
      setSelectedGroupId(id);
      setLoadingChangingGroup(true);

      const response = await privateAxios.get(`/private/change-group/${id}`);

      if (response.status === 200) {
        const { message, token, groupName, currentGroupId } = response.data;

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('groupName', groupName);
        await AsyncStorage.setItem('currentGroupId', currentGroupId);

        navigation.navigate('user-dashboard', { successMessage: message || 'You have successfully changed to a new group!' });
      }
      else {
        setNotification({ visible: true, type: "error", message: "Failed to change group" });
        setTimeout(() => {
          setNotification({ visible: false, type: "", message: "" });
        }, 3000);
      }
    } catch (error) {
      setNotification({ visible: true, type: "error", message: error?.response?.data?.message || "Failed to change your group." });
      setTimeout(() => {
        setNotification({ visible: false, type: "", message: "" });
      }, 3000);
    } finally {
      setLoadingChangingGroup(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await privateAxios.get(`/private/user-groups`);
      setGroups(response.data.groups || []);
      setShowGroups(true);
    } catch (err) {
      console.error('Group fetch error:', err);
      setNotification({ visible: true, type: 'error', message: err?.response?.data?.message || 'Unable to fetch groups.', });
      setTimeout(() => {
        setNotification({ visible: false, type: '', message: '', });
      }, 3000);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('edit-profile');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('currentGroupId');
    await AsyncStorage.removeItem('groupName');
    dispatch(logout());
    navigation.replace('login');
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          stylesConfig.SETTINGS_STYLES.container,
          { backgroundColor: colors.background },
        ]}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          <Notification
            visible={notification.visible}
            type={notification.type}
            message={notification.message}
          />

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Settings</Text>
            <Pressable style={[stylesConfig.BUTTON, { backgroundColor: colors.secondary }]} onPress={showMemberNumber} disabled={memberNumberShown || memberNumberLoading}>
              {memberNumberLoading ?
                <View style={{ flexDirection: 'row', columnGap: 10 }}><ActivityIndicator /><Text style={{ color: colors.text }}>Loading Member ID...</Text></View> :
                <Text style={{ color: colors.text }}>{memberNumber || "Show My Member ID"}</Text>}
            </Pressable>
          </View>

          {/* ✏️ Edit Profile */}
          <Pressable
            style={[stylesConfig.BUTTON, { backgroundColor: colors.primary }]}
            onPress={handleEditProfile}
          >
            <Text
              style={{
                color: colors.mainButtonText,
                fontSize: 16,
                fontWeight: 'bold',
              }}
            >
              ✏️ Edit Profile
            </Text>
          </Pressable>

          {/* 🔄 Change Group */}
          <Pressable
            style={[stylesConfig.BUTTON, { backgroundColor: colors.secondary }]}
            onPress={fetchGroups}
          >
            <Text style={{ color: colors.text, fontSize: 16 }}>
              🔄 Change Group
            </Text>
          </Pressable>



          {loadingGroups ? (
            <View style={{ flexDirection: 'row', columnGap: 10, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 10 }}
              />
              <Text style={{ color: colors.text }}>Fetching your groups, please wait...</Text>
            </View>
          ) :
            showGroups && groups.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: colors.placeholder, marginBottom: 6 }}>
                  Your Groups:
                </Text>
                {groups.map((group) => (
                  <Pressable
                    key={group._id}
                    style={[
                      stylesConfig.CARD,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                    disabled={group.status === 'inactive'}
                    onPress={() => { handleChangeGroup(group._id) }}
                  >
                    {loadingChangingGroup && (group._id === selectedGroupId) && (
                      <View style={{ flexDirection: 'row', columnGap: 10, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                          style={{ marginVertical: 10 }}
                        />
                        <Text style={{ color: colors.text }}>Changing to </Text>
                      </View>)}
                    <Text style={{ color: colors.text, fontWeight: '600' }}>
                      {group.name}{loadingChangingGroup && (group._id === selectedGroupId) ? "..." : null}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

          {/* 🌙 Theme Toggle */}
          <View
            style={[
              stylesConfig.SETTINGS_STYLES.optionRow,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text
              style={[
                stylesConfig.SETTINGS_STYLES.optionText,
                { color: colors.text },
              ]}
            >
              Dark Mode
            </Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              thumbColor={theme === 'dark' ? colors.primary : '#ccc'}
              trackColor={{ false: '#767577', true: colors.secondary }}
            />
          </View>

          {/* Placeholder - Account Settings */}
          <View style={{ marginTop: 25 }}>
            <Text
              style={[
                stylesConfig.SETTINGS_STYLES.header,
                { color: colors.text, fontSize: 20 },
              ]}
            >
              Account & Privacy
            </Text>

            <Pressable
              style={[
                stylesConfig.BUTTON,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => { }}
            >
              <Text style={{ color: colors.text }}>🔒 Change Password</Text>
            </Pressable>

            <Pressable
              style={[
                stylesConfig.BUTTON,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => { navigation.navigate('create-another-group') }}
            >
              <Text style={{ color: colors.text }}>
                📵 Create Another Group
              </Text>
            </Pressable>
          </View>

          {/* 🚪 Logout */}
          <Pressable
            style={[
              stylesConfig.BUTTON,
              { backgroundColor: '#d9534f', marginTop: 30 },
            ]}
            onPress={handleLogout}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              🚪 Logout
            </Text>
          </Pressable>
        </ScrollView>
      </View>
      <Footer />
    </View>
  );
}
