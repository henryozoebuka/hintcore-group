import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const [auth, setAuth] = useState({
    userId: null,
    currentGroupId: null,
    permissions: [],
    isAuthenticated: false,
  });

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setAuth({ userId: null, currentGroupId: null, permissions: [], isAuthenticated: false });
          return;
        }

        const decoded = jwt_decode(token);

        setAuth({
          userId: decoded.userId,
          currentGroupId: decoded.currentGroupId, // ✅ match your state naming
          permissions: decoded.permissions || [],
          isAuthenticated: true,
        });
      } catch (err) {
        console.error("Error decoding token:", err);
        setAuth({ userId: null, currentGroupId: null, permissions: [], isAuthenticated: false });
      }
    };

    loadAuth();
  }, []);

  return auth;
};