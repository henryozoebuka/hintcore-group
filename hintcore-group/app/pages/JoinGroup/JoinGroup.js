import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import HONTCOREGROUPLOGO from '../../../assets/images/hintcore-group-logo.png';

export default function JoinGroup() {
  const navigation = useNavigation();
  const { colors } = useSelector((state) => state.colors);

  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code.');
      return;
    }

    try {
      setLoading(true);
      // TODO: Replace with your API request
      // await axios.post('/groups/join', { code: groupCode });

      Alert.alert('Success', 'You have joined the group!');
      navigation.navigate('Home'); // Or the Groups screen
    } catch (error) {
      Alert.alert('Error', 'Invalid group code or something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 60,
            alignItems: 'center',
          }}
        >
          {/* Logo */}
          <Image
            source={HONTCOREGROUPLOGO}
            style={{ width: 100, height: 100, marginBottom: 16 }}
            resizeMode="contain"
          />

          {/* Title */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: colors.text,
            }}
          >
            Hintcore Group
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              opacity: 0.7,
              marginBottom: 32,
            }}
          >
            Join an existing group
          </Text>

          {/* Group Code Input */}
          <TextInput
            style={{
              width: '100%',
              backgroundColor: colors.inputBackground,
              color: colors.text,
              padding: 14,
              borderRadius: 10,
              fontSize: 16,
              marginBottom: 16,
            }}
            placeholder="Enter group code"
            placeholderTextColor={colors.placeholder}
            value={groupCode}
            onChangeText={setGroupCode}
          />

          {/* Join Button */}
          <Pressable
            style={{
              backgroundColor: loading ? colors.border : colors.primary,
              paddingVertical: 14,
              borderRadius: 10,
              width: '100%',
              alignItems: 'center',
              marginBottom: 20,
            }}
            onPress={handleJoinGroup}
            disabled={loading}
          >
            <Text
              style={{
                color: colors.mainButtonText,
                fontSize: 16,
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Joining...' : 'Join Group'}
            </Text>
          </Pressable>

          {/* Cancel Button */}
          <View style={{ width: '100%', marginTop: 10 }}>
            <Pressable
              style={{
                backgroundColor: colors.secondary,
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
              onPress={() => navigation.goBack()}
            >
              <Text
                style={{
                  color: colors.buttonText,
                  fontWeight: '600',
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}