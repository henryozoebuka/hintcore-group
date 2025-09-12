import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import privateAxios from '../../utils/axios/privateAxios';
import Notification from '../../components/Notification/Notification';
import Footer from '../../components/Footer/Footer';
import stylesConfig from '../../styles/styles';

const ManageEditGroupInformation = () => {
  const { colors } = useSelector((state) => state.colors);
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    oldGroupPassword: '',
    groupPassword: '',
    confirmGroupPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notification, setNotification] = useState({ visible: false, type: '', message: '' });
  const [editPassword, setEditPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await privateAxios.get(`/private/manage-get-group-information-for-update`);
        const { name, description } = response.data.group;
        setFormData((p) => ({
          ...p,
          name,
          description: description || '',
        }));
      } catch (err) {
        console.error('Load group info error:', err);
        setNotification({ visible: true, type: 'error', message: 'Unable to load group info' });
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
      if (editPassword) {
        const { oldGroupPassword, groupPassword, confirmGroupPassword } = formData;

        if (!oldGroupPassword || !groupPassword || !confirmGroupPassword) {
          setNotification({
            visible: true,
            type: 'error',
            message: 'Fill all password fields.',
          });
          setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
          setLoading(false);
          return;
        }

        if (groupPassword !== confirmGroupPassword) {
          setNotification({
            visible: true,
            type: 'error',
            message: 'Passwords must match.',
          });
          setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
      };

      if (editPassword) {
        payload.oldGroupPassword = formData.oldGroupPassword;
        payload.groupPassword = formData.groupPassword;
      }

      const response = await privateAxios.patch(`/private/manage-update-group-information`, payload);

      if (response.status === 200) {
        setNotification({
          visible: true,
          type: 'success',
          message: 'Group information updated successfully',
        });
        setTimeout(() => {
          setNotification({ visible: false, type: '', message: '' });
          navigation.goBack();
        }, 3000);

        if (editPassword) {
          setFormData((p) => ({
            ...p,
            oldGroupPassword: '',
            groupPassword: '',
            confirmGroupPassword: '',
          }));
          setEditPassword(false);
        }
      }
    } catch (err) {
      console.error('Update group error:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Update failed. Try again.';
      setNotification({ visible: true, type: 'error', message });
      setTimeout(() => setNotification({ visible: false, type: '', message: '' }), 3000);
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
        <View style={[stylesConfig.CENTERED_CONTAINER, { backgroundColor: colors.background, flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading group information...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            backgroundColor: colors.background,
            padding: 20,
            paddingBottom: 10, // space for Footer
            minHeight: '100%',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[stylesConfig.SETTINGS_STYLES.header, { color: colors.text }]}>Edit Group Information</Text>

          {/* Group Name */}
          <TextInput
            style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Group Name"
            placeholderTextColor={colors.placeholder}
            value={formData.name}
            onChangeText={(t) => handleChange('name', t)}
          />

          {/* Description */}
          <TextInput
            style={[
              stylesConfig.INPUT,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                height: 150,
                textAlignVertical: 'top',
              },
            ]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.placeholder}
            value={formData.description}
            onChangeText={(t) => handleChange('description', t)}
            multiline
            maxLength={500}
          />
          <Text style={{ color: colors.placeholder, alignSelf: 'flex-end', marginBottom: 12 }}>
            {formData.description.length}/500
          </Text>

          {/* Image URL */}
          {/* <TextInput
            style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Image URL (optional)"
            placeholderTextColor={colors.placeholder}
            value={formData.imageUrl}
            onChangeText={(t) => handleChange('imageUrl', t)}
          /> */}

          {/* Preview image if valid */}
          {formData.imageUrl ? (
            <Image
              source={{ uri: formData.imageUrl }}
              style={{ width: '100%', height: 150, marginVertical: 10, borderRadius: 8 }}
              resizeMode="cover"
              onError={() => setNotification({ visible: true, type: 'error', message: 'Invalid image URL' })}
            />
          ) : null}

          {/* Password Change Toggle */}
          <Pressable
            onPress={() => {
              setEditPassword((prev) => !prev);
              setFormData((p) => ({
                ...p,
                oldGroupPassword: '',
                groupPassword: '',
                confirmGroupPassword: '',
              }));
            }}
            style={[stylesConfig.BUTTON, { backgroundColor: colors.secondary }]}
          >
            <Text style={{ color: colors.text }}>
              {editPassword ? 'Cancel Password Change' : 'Change Group Password'}
            </Text>
          </Pressable>

          {editPassword && (
            <>
              <TextInput
                style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="Current Group Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={formData.oldGroupPassword}
                onChangeText={(t) => handleChange('oldGroupPassword', t)}
              />
              <TextInput
                style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="New Group Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={formData.groupPassword}
                onChangeText={(t) => handleChange('groupPassword', t)}
              />
              <TextInput
                style={[stylesConfig.INPUT, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="Confirm New Group Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={formData.confirmGroupPassword}
                onChangeText={(t) => handleChange('confirmGroupPassword', t)}
              />
            </>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            style={[
              stylesConfig.BUTTON,
              {
                backgroundColor: colors.primary,
                marginTop: 20,
                flexDirection: 'row',
                columnGap: 10,
                justifyContent: 'center',
              },
            ]}
            disabled={loading}
          >
            {loading && <ActivityIndicator color={colors.mainButtonText} />}
            <Text style={{ color: colors.mainButtonText, fontWeight: '600' }}>
              {loading ? 'Updating Group...' : 'Update Group'}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <Footer />
    </View>
  );
};

export default ManageEditGroupInformation;