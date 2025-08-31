import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import USERIMAGEALT from '../../../assets/images/hintcore-group-logo.png';
import stylesConfig from '../../styles/styles';

export default function Profile() {
  const { colors } = useSelector((state) => state.colors);
  const navigation = useNavigation();

  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [profile, setProfile] = useState(null);
  const [showBio, setShowBio] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const storedGroupName = await AsyncStorage.getItem('groupName');
      setGroupName(storedGroupName || '');
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await privateAxios.get(`/private/user-profile`);
        setProfile(response.data.user);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setNotification({
          visible: true,
          type: 'error',
          message: err?.response?.data?.message || 'Failed to load profile.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loading ?
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
          <View style={{ paddingHorizontal: 20 }}>

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
                <Text style={[stylesConfig.CARD_HEADER, { color: colors.text }]}>🧾 Bio</Text>
                {showBio ? (
                  <Text style={{ color: colors.text }}>{profile.bio}</Text>
                ) : (
                  <Text style={{ color: colors.placeholder, fontStyle: 'italic' }}>
                    Tap to show
                  </Text>
                )}
              </Pressable>
            ) : null}


          </View>

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
            <Pressable
              onPress={() => navigation.navigate('edit-profile')}
              style={[stylesConfig.BUTTON, { backgroundColor: colors.primary, marginBottom: 10 }]}
            >
              <Text style={{ color: colors.mainButtonText, fontWeight: 'bold' }}>✏️ Edit Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('user-dashboard')}
              style={[stylesConfig.BUTTON, { backgroundColor: colors.secondary }]}
            >
              <Text style={{ color: colors.text }}>📊 User Dashboard</Text>
            </Pressable>
          </View>
        </ScrollView>
      }
      <Footer />
    </View>
  );
}
