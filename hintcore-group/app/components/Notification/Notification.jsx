import React from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

const Notification = ({ visible, type, message }) => {
  const { colors } = useSelector((state) => state.colors);

  if (!visible) return null;

  const backgroundColor = type === 'success'
    ? '#DFF5E1' // soft green tint
    : '#FDECEA'; // soft red tint

  const borderColor = type === 'success'
    ? '#6BCB77' // green border
    : '#FF6B6B'; // red border

  const textColor = type === 'success'
    ? '#2E7D32'
    : '#C62828';

  return (
    <View
      style={{
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 9999,
        padding: 14,
        backgroundColor,
        borderLeftWidth: 6,
        borderLeftColor: borderColor,
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text style={{ color: textColor, fontWeight: '500', textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
};

export default Notification;