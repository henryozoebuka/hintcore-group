import axios from 'axios';
import { REACT_NATIVE_SERVER_URL } from '@env';

const publicAxios = axios.create({
  baseURL: REACT_NATIVE_SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default publicAxios;