import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import USERIMAGEALT from '../../../assets/images/hintcore-group-logo.png';
import stylesConfig from '../../styles/styles';

const ManageProfile = () => {
  const { colors } = useSelector((state) => state.colors);
  const navigation = useNavigation();

  const [groupName, setGroupName] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [profile, setProfile] = useState(null);
  const [showBio, setShowBio] = useState(false);

  const route = useRoute();
  const { id } = route.params;

  const handleViewUserGroup = async () => {
    try {
      setGroupLoading(true);
      setGroups([]);
      const response = await privateAxios.get(`/private/manage-get-user-groups/${id}`);
      if (response.status === 200) {
        if (response.data.groups.length < 1) {
          setNotification({ visible: true, type: 'error', message: 'This user does not belong to any group.' });
          setTimeout(() => {
            setNotification({ visible: false, type: '', message: '' })
          }, 3000);
        }
        setGroups(response.data.groups);
      }
    } catch (error) {
      if (__DEV__) console.error(error);
    } finally {
      setGroupLoading(false);
    }
  }
  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedGroupName = await AsyncStorage.getItem('groupName');
      setGroupName(storedGroupName || '');
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchManageProfile = async () => {
      try {
        const response = await privateAxios.get(`/private/manage-profile/${id}`);
        setProfile(response.data.user);
      } catch (err) {
        if (__DEV__) console.error('Profile fetch error:', err);
        setNotification({ visible: true, type: 'error', message: err?.response?.data?.message || 'Failed to load profile.' });
        setTimeout(() => {
          setNotification({ visible: false, type: '', message: '' })
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchManageProfile();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loading || !profile ?
        <View style={[stylesConfig.CENTERED_CONTAINER, { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading Profile...</Text>
        </View> :
        <ScrollView style={{ backgroundColor: colors.background }}>
          <Notification visible={notification.visible} type={notification.type} message={notification.message} />

          {/* Profile Header */}
          <View style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Image
              source={profile.imageUrl ? { uri: profile.imageUrl } : USERIMAGEALT}
              style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 16 }}
              resizeMode="cover"
            />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, textTransform: 'capitalize' }}>
              {profile.fullName}
            </Text>
            <Text style={{ fontSize: 16, color: colors.placeholder }}>{profile.email}</Text>
            <Text style={{ fontSize: 16, color: colors.placeholder }}>+{profile.phoneNumber}</Text>
          </View>

          {/* Profile Details */}
          <ScrollView style={{ paddingHorizontal: 20 }}>

            {/* Gender */}
            <View style={[stylesConfig.CARD, { borderColor: colors.border }]}>
              <Text style={[stylesConfig.CARD_HEADER, { color: colors.text }]}>👤 Gender: </Text>
              <Text style={{ color: colors.text, textTransform: 'capitalize' }}>{profile.gender}</Text>
            </View>

            {/* Verification */}
            <View style={[stylesConfig.CARD, { borderColor: colors.border }]}>
              <Text style={[stylesConfig.CARD_HEADER, { color: colors.text }]}>✅ Verified: </Text>
              <Text style={{ color: profile.verified ? 'green' : 'red', fontWeight: 'bold' }}>
                {profile.verified ? 'Yes' : 'No'}
              </Text>
            </View>

            {/* Verification */}
            <View style={[stylesConfig.CARD, { borderColor: colors.border }]}>
              <Text style={[stylesConfig.CARD_HEADER, { color: colors.text }]}>🧑‍💻 User Role: </Text>
              <Text style={{ color: profile.verified ? 'green' : 'red', fontWeight: 'bold' }}>
                {profile.userRole === 'super_admin' ? 'Super Admin' : `${profile.userRole[0].toUpperCase() + profile.userRole.slice(1)}` }
              </Text>
            </View>

            {/* Current Group */}
            <View style={[stylesConfig.CARD, { borderColor: colors.border }]}>
              <Text style={[stylesConfig.CARD_HEADER, { color: colors.text }]}>👥 Current Group: </Text>
              {groupName ? (
                <Text style={{ color: colors.text, textTransform: 'capitalize' }}>{groupName}</Text>
              ) : (
                <Text style={{ color: colors.placeholder }}>No group selected.</Text>
              )}
            </View>

            {/* Bio */}
            {profile.bio ? (
              <Pressable
                onPress={() => setShowBio((prev) => !prev)}
                style={[stylesConfig.CARD, {
                  borderColor: colors.border,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  rowGap: 10,
                }]}
              >
                <Text style={[stylesConfig.CARD_HEADER, { color: colors.text, fontWeight: 'bold' }]}>🧾 Bio</Text>
                {showBio ? (
                  <Text style={{ color: colors.text }}>{profile.bio}</Text>
                ) : (
                  <Text style={{ color: colors.placeholder, fontStyle: 'italic' }}>
                    Tap to show
                  </Text>
                )}
              </Pressable>
            ) : null}

            {/* User Groups */}
            {groups.length > 0 &&
              <View style={{ padding: 5, borderWidth: 1, borderColor: colors.border, flexDirection: 'column' }}>
                <Text style={{ color: colors.text, fontWeight: 'bold', marginBottom: 10 }}>User Groups</Text>
                <View>
                  {groups.map((item, index) => (
                    <Pressable style={{ backgroundColor: colors.secondary, borderRadius: 10, marginBottom: 10, paddingVertical: 5, paddingHorizontal: 10 }} key={index} onPress={() => navigation.navigate('manage-group-information', { id: item._id })}>
                      <Text style={{ color: colors.text }}>{item.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
          </ScrollView>


          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
            <Pressable
              onPress={() => navigation.navigate('manage-edit-profile', {id})}
              style={[stylesConfig.BUTTON, { backgroundColor: colors.primary, marginBottom: 10 }]}
            >
              <Text style={{ color: colors.mainButtonText, fontWeight: 'bold' }}>✏️ Edit User Profile</Text>
            </Pressable>

            <Pressable
              onPress={handleViewUserGroup}
              style={[stylesConfig.BUTTON, { backgroundColor: groupLoading ? colors.border : colors.secondary, flexDirection: 'row', columnGap: 10, justifyContent: 'center', alignItems: 'center' }]}
              disabled={groupLoading || loading}
            >
              {groupLoading && <ActivityIndicator size="small" color={colors.primary} />}
              <Text style={{ color: colors.text }}>{groupLoading ? 'Fetching User Groups...' : '👨‍👩‍👧‍👦 View User Group'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      }
      <Footer />
    </View>
  );
}

export default ManageProfile;