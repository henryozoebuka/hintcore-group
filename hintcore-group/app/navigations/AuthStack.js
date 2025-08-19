// AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../pages/Login/Login.js';
import CreateGroup from '../pages/CreateGroup/CreateGroup.js';
// import CreateGroup from '../pages/CreateGroup/CreateGroup.js';
// import RegisterScreen from '../screens/Auth/RegisterScreen';
// import ConfirmOTPScreen from '../screens/Auth/ConfirmOTPScreen';
// import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator initialRouteName="login" screenOptions={{headerShown: false}}>
      <Stack.Screen name="login" component={Login} />
      <Stack.Screen name="create-group" component={CreateGroup} />
    </Stack.Navigator>
  );
};

export default AuthStack;