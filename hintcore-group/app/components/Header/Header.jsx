import React from "react";
import { View, Text, Pressable } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { Ionicons } from "@expo/vector-icons";
import globalStyles from "../../styles/styles"; // ✅ Import shared styles

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const styles = globalStyles.HEADER_STYLES;

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hintcore Group</Text>

      <View style={styles.rightSection}>
        {user && <Text style={styles.username}>{user.name}</Text>}

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Header;