import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const EditProfile = () => {
  const { colors } = useSelector((state) => state.colors);
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    bio: '',
    gender: 'other',
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [editPasswords, setEditPasswords] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await privateAxios.get(`/private/fetch-edit-profile`);
        const { fullName, phoneNumber, bio, gender } = response.data.user;
        setFormData((p) => ({ ...p, fullName, phoneNumber, bio: bio || '', gender }));
      } catch (err) {
        console.error('Load profile error:', err);
        setNotification({ visible: true, type: 'error', message: 'Unable to load profile' });
        setTimeout(() => {
          setNotification({ visible: false, type: '', message: '' });
        }, 3000);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const handleChange = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editPasswords) {
        const { oldPassword, password, confirmPassword } = formData;

        if (!oldPassword || !password || !confirmPassword) {
          setNotification({
            visible: true,
            type: 'error',
            message: 'Fill all password fields.',
          });
          setTimeout(() => {
            setNotification({ visible: false, type: '', message: '' });
          }, 3000);
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setNotification({
            visible: true,
            type: 'error',
            message: 'Passwords must match.',
          });
          setTimeout(() => {
            setNotification({ visible: false, type: '', message: '' });
          }, 3000);
          setLoading(false);
          return;
        }
      }

      const payload = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        gender: formData.gender,
      };

      if (editPasswords) {
        payload.oldPassword = formData.oldPassword;
        payload.password = formData.password;
      }

      const response = await privateAxios.patch(`/private/update-profile`, payload);

      if (response.status === 200) {
        setNotification({
          visible: true,
          type: 'success',
          message: 'Profile updated successfully',
        });
        setTimeout(() => {
          setNotification({ visible: false, type: '', message: '' });
          navigation.navigate('profile');
        }, 3000);

        if (editPasswords) {
          setFormData((p) => ({
            ...p,
            oldPassword: '',
            password: '',
            confirmPassword: '',
          }));
          setEditPasswords(false);
        }
      }

    } catch (err) {
      console.error('Update error:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Update failed. Try again.';

      setNotification({
        visible: true,
        type: 'error',
        message,
      });

      setTimeout(() => {
        setNotification({ visible: false, type: '', message: '' });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Notification
        visible={notification.visible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ visible: false, type: '', message: '' })}
      />

      {initialLoading ? (
        <View style={[stylesConfig.CENTERED_CONTAINER, { backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center', }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading your data...</Text>
        </View>
      ) : (

        <ScrollView
          contentContainerStyle={{
            backgroundColor: colors.background,
            padding: 20,
            paddingBottom: 10, // to make space for Footer
            minHeight: '100%',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Edit Profile</Text>

          {/* Full Name */}
          <View style={{ rowGap: 5 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold' }}>Fullname</Text>
            <TextInput
              style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="Full Name"
              placeholderTextColor={colors.placeholder}
              value={formData.fullName}
              onChangeText={(t) => handleChange('fullName', t)}
            />
          </View>

          {/* Phone Number with + sign prefix */}
          <View style={{ rowGap: 5 }}>
            <Text style={{ color: colors.text, fontWeight: 'bold' }}>Phone Number</Text>
            <View
              style={[
                stylesConfig.INPUT,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.inputBackground,
                  paddingHorizontal: 10,
                },
              ]}
            >
              {formData.phoneNumber && <Text style={{ color: colors.text, fontSize: 16, marginRight: 4 }}>+</Text>}
              <TextInput
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 16,
                }}
                placeholder="Phone Number"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(t) => handleChange('phoneNumber', t)}
              />
            </View>
          </View>

          {/* Bio */}
          <View style={{rowGap: 5}}>
            <Text style={{color: colors.text, fontWeight: 'bold'}}>Bio</Text>
          <TextInput
            style={[
              stylesConfig.INPUT,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                height: 200,
                textAlignVertical: 'top',
                marginBottom: 0,
              },
            ]}
            placeholder="Bio (optional). This can be seen by any group you belong to."
            placeholderTextColor={colors.placeholder}
            value={formData.bio}
            onChangeText={(t) => handleChange('bio', t)}
            multiline
            maxLength={300}
          />
          <Text style={{ color: colors.placeholder, alignSelf: 'flex-end', marginBottom: 12 }}>
            {formData.bio.length}/300
          </Text>
          </View>

          {/* Gender */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ marginBottom: 8, color: colors.text, fontWeight: '600' }}>Gender</Text>
            <View style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: colors.inputBackground,
            }}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(val) => handleChange('gender', val)}
                style={{ color: colors.text }}
                dropdownIconColor={colors.text}
              >
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

          {/* Password Change Toggle */}
          <Pressable
            onPress={() => {
              setEditPasswords((prev) => !prev);
              setFormData((p) => ({
                ...p,
                oldPassword: '',
                password: '',
                confirmPassword: '',
              }));
            }}
            style={[stylesConfig.BUTTON, { backgroundColor: colors.secondary }]}
          >
            <Text style={{ color: colors.text }}>
              {editPasswords ? 'Cancel Password Change' : 'Change Password'}
            </Text>
          </Pressable>

          {editPasswords && (
            <>
              <TextInput
                style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="Current Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={formData.oldPassword}
                onChangeText={(t) => handleChange('oldPassword', t)}
              />
              <TextInput
                style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="New Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={formData.password}
                onChangeText={(t) => handleChange('password', t)}
              />
              <TextInput
                style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={(t) => handleChange('confirmPassword', t)}
              />
            </>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            style={[stylesConfig.BUTTON, {
              backgroundColor: colors.primary,
              marginTop: 20,
              flexDirection: 'row',
              columnGap: 10,
              justifyContent: 'center',
            }]}
            disabled={loading}
          >
            {loading && <ActivityIndicator color={colors.mainButtonText} />}
            <Text style={{ color: colors.mainButtonText, fontWeight: '600' }}>
              {loading ? 'Updating Profile...' : 'Update Profile'}
            </Text>
          </Pressable>
        </ScrollView>

      )}
      <Footer />
    </View>
  );
};

export default EditProfile;