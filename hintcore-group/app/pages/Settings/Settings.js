import React, { useEffect, useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLightMode, setDarkMode } from '../../redux/slices/colorsSlice';
import styles from '../../styles/styles';

const Settings = () => {
  const dispatch = useDispatch();
  const { theme, colors } = useSelector((state) => state.colors);

  // Load saved theme on mount
  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark') {
        dispatch(setDarkMode());
      } else {
        dispatch(setLightMode());
      }
    })();
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

  return (
    <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.SETTINGS_STYLES.header, { color: colors.text }]}>Settings</Text>

      <View style={[styles.SETTINGS_STYLES.optionRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.SETTINGS_STYLES.optionText, { color: colors.text }]}>
          Dark Mode
        </Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={toggleTheme}
          thumbColor={theme === 'dark' ? colors.primary : '#ccc'}
          trackColor={{ false: '#767577', true: colors.secondary }}
        />
      </View>
    </View>
  );
};

export default Settings;