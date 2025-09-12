import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
// import { logout } from '../../redux/slices/authSlice';
// import { Ionicons } from '@expo/vector-icons';
import globalStyles from '../../styles/styles';
import { useNavigation } from '@react-navigation/native';

const Header = () => {
  const navigation = useNavigation();
  // const dispatch = useDispatch();
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

  // const handleLogout = async () => {
  //   await AsyncStorage.removeItem('token');
  //   await AsyncStorage.removeItem('currentGroupId');
  //   await AsyncStorage.removeItem('groupName');
  //   dispatch(logout());
  // };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Pressable onPress={() => navigation.navigate('group-information')}>
        <Text style={styles.title}>
          {loading ? 'Loading...' : groupName || 'Hintcore Group'}
        </Text>
      </Pressable>

      {/* <View style={styles.rightSection}>
        <Pressable
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: '#ef4444' }]}
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View> */}
    </View>
  );
};

export default Header;