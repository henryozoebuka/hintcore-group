import AsyncStorage from "@react-native-async-storage/async-storage";
import * as jwt_decode from "jwt-decode";
import { useEffect } from "react";
import { useState } from "react";

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

        // 👇 works with ESM in RN
        const decoded = jwt_decode.default(token);

        setAuth({
          userId: decoded.id,
          groupId: decoded.currentGroupId,
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