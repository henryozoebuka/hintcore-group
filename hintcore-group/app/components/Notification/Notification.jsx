import React from 'react';
import { Animated, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

const Notification = ({ visible, type, message }) => {
  const { colors } = useSelector((state) => state.colors);

  if (!visible) return null;

  const bgColor = type === 'success' ? 'green' : 'red';

  return (
    <View
      style={{
        position: 'absolute',
        top: 50, // Distance from top of the screen
        left: 20,
        right: 20,
        zIndex: 9999,
        padding: 14,
        backgroundColor: bgColor,
        borderRadius: 8,
        elevation: 5, // For Android shadow
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
        {message}
      </Text>
    </View>
  );
}

export default Notification;