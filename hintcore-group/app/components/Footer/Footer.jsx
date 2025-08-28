import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../../styles/styles';
import { useSelector } from 'react-redux';

const Footer = () => {
  const navigation = useNavigation();
  const { colors } = useSelector((state) => state.colors);

  return (
    <View style={[styles.FOOTER_STYLES.container, {backgroundColor: colors.primary} ]}>
      <Pressable
        style={{ flex: 1, alignItems: 'center' }}
        onPress={() => navigation.navigate('user-dashboard')}
      >
        <Ionicons name="home" size={25} color={colors.mainButtonText} />
        <Text style={{ color: colors.mainButtonText }}>Home</Text>
      </Pressable>

      <Pressable
        style={{ flex: 1, alignItems: 'center' }}
        onPress={() => navigation.navigate('settings')}
      >
        <Ionicons name="settings" size={25} color={colors.mainButtonText} />
        <Text style={{ color: colors.mainButtonText }}>Settings</Text>
      </Pressable>

      <Pressable
        style={{ flex: 1, alignItems: 'center' }}
        onPress={() => navigation.navigate('profile')}
      >
        <Ionicons name="person" size={25} color={colors.mainButtonText} />
        <Text style={{ color: colors.mainButtonText }}>Profile</Text>
      </Pressable>

      <Pressable
        style={{ flex: 1, alignItems: 'center' }}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={25} color={colors.mainButtonText} />
        <Text style={{ color: colors.mainButtonText }}>Back</Text>
      </Pressable>
    </View>
  );
};

export default Footer;