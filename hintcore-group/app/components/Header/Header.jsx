import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../../styles/styles';

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { colors } = useSelector((state) => state.colors);
  const styles = globalStyles.HEADER_STYLES;

  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGroupName = async () => {
      try {
        const storedGroupName = await AsyncStorage.getItem('groupName');
        if (isMounted) {
          setGroupName(storedGroupName || '');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching group name:', error);
      }
    };

    fetchGroupName();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('currentGroupId');
    await AsyncStorage.removeItem('groupName');
    dispatch(logout());
    navigation.replace('login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Text style={styles.title}>
        {loading ? 'Loading...' : groupName || 'Hintcore Group'}
      </Text>

      <View style={styles.rightSection}>
        {user?.name && <Text style={styles.username}>{user.name}</Text>}

        <Pressable
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: '#ef4444' }]}
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Header;