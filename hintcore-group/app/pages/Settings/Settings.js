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
import {
  setDarkMode,
  setLightMode,
} from '../../redux/slices/colorsSlice';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

export default function Settings() {
  const { colors, theme } = useSelector((state) => state.colors);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [userId, setUserId] = useState('');
  const [groups, setGroups] = useState([]);
  const [showGroups, setShowGroups] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: '',
    message: '',
  });

  useEffect(() => {
    const loadUserIdAndTheme = async () => {
      const id = await AsyncStorage.getItem('userId');
      const savedTheme = await AsyncStorage.getItem('theme');

      if (id) setUserId(id);

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

  const handleChangeGroup = async () => {
    try {
      setLoadingGroups(true);
      const response = await privateAxios.get(`/private/user-groups/${userId}`);
      setGroups(response.data.groups || []);
      setShowGroups(true);
    } catch (err) {
      console.error('Group fetch error:', err);
      setNotification({
        visible: true,
        type: 'error',
        message: err?.response?.data?.message || 'Unable to fetch groups.',
      });
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleEditProfile = () => {
    if (!userId) return;
    navigation.navigate('edit-profile', { userId });
  };

  const handleLogout = () => {
    dispatch(logout());
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
          <Text
            style={[
              stylesConfig.SETTINGS_STYLES.header,
              { color: colors.text },
            ]}
          >
            Settings
          </Text>

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
            onPress={handleChangeGroup}
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
                    disabled={group.staus === 'inactive'}
                    onPress={async () => {
                      await AsyncStorage.setItem('currentGroupId', group._id);
                      await AsyncStorage.setItem('groupNmae', group.name);
                      setNotification({
                        visible: true,
                        type: 'success',
                        message: `Switched to ${group.name}`,
                      });
                      setTimeout(() => {
                        navigation.navigate('user-dashboard');
                      }, 3000);
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600' }}>
                      {group.name}
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
              onPress={() => { }}
            >
              <Text style={{ color: colors.text }}>
                📵 Notification Preferences
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
