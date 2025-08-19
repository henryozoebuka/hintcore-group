// RootNavigator.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { ActivityIndicator, View } from 'react-native';
import { checkAuth } from '../redux/slices/authSlice';

const RootNavigator = () => {
  const dispatch = useDispatch();
  const { isLoading, isLoggedIn } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return isLoggedIn ? <MainStack /> : <AuthStack />;
};

export default RootNavigator;
