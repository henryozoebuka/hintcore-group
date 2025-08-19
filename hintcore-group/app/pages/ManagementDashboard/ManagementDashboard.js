import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import styles from "../../styles/styles";

const ManagmentDashboard = ({ navigation }) => {
  const isDarkMode = useSelector((state) => state.colors.isDarkMode);
  const COLORS = isDarkMode ? styles.DARKCOLORS : styles.LIGHTCOLORS;

  return (
    <View style={[styles.SETTINGS_STYLES.container, { backgroundColor: COLORS.background }]}>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.SETTINGS_STYLES.header, { color: COLORS.text }]}>
          Quick Actions
        </Text>

          <Pressable onPress={() => navigation.navigate('manage-announcements')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border }} >
            <Text style={{ fontSize: 18, color: COLORS.text }}>Manage Announcements</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('manage-users')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border }} >
            <Text style={{ fontSize: 18, color: COLORS.text }}>Manage Users</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('manage-events')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border }} >
            <Text style={{ fontSize: 18, color: COLORS.text }}>Manage Events</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('manage-announcements')} style={{ padding: 18, marginBottom: 14, borderRadius: 12, backgroundColor: COLORS.inputBackground, borderWidth: 1, borderColor: COLORS.border }} >
            <Text style={{ fontSize: 18, color: COLORS.text }}>Manage Constitution</Text>
          </Pressable>
        
      </ScrollView>
    </View>
  );
};

export default ManagmentDashboard;