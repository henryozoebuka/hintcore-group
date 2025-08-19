import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { useSelector } from 'react-redux';

const ConfirmDialog = ({ visible, title, message, onConfirm, onCancel }) => {
  const { colors } = useSelector((state) => state.colors);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: colors.background,
          padding: 20,
          borderRadius: 10,
          width: '80%'
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>{title}</Text>
          <Text style={{ color: colors.text, marginBottom: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable onPress={onCancel} style={{ marginRight: 10 }}>
              <Text style={{ color: colors.primary }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm}>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ConfirmDialog;