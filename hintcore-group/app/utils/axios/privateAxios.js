import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REACT_NATIVE_SERVER_URL } from '@env';
import store from '../../redux/store';
import { setIsLoggedIn } from '../../redux/slices/authSlice';
import { navigate } from '../navigationRef';

const privateAxios = axios.create({
  baseURL: REACT_NATIVE_SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token to each request
privateAxios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired/invalid token
privateAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      await AsyncStorage.multiRemove(['token', 'userId']);
      setTimeout(() => {
        store.dispatch(setIsLoggedIn(false));
        navigate('login');
      }, 3000);
    }

    return Promise.reject(error);
  }
);

export default privateAxios;