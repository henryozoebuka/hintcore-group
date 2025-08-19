import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Header from '../components/Header/Header';
import Profile from '../pages/Profile/Profile';
import UserDashboard from '../pages/UserDashboard/UserDashboard';
import ManagementDashboard from '../pages/ManagementDashboard/ManagementDashboard';
import ManageUsers from '../pages/ManageUsers/ManageUsers';
import CreateAnnouncement from '../pages/CreateAnnouncement/CreateAnnouncement';

const Stack = createStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator initialRouteName="profile">
      <Stack.Screen name="profile" component={Profile} options={{ header: () => <Header title="My Profile" showBack={false} /> }} />
      <Stack.Screen name="user-dashboard" component={UserDashboard} options={{ header: () => <Header title="My Dashbord" showBack={false} /> }} />
      <Stack.Screen name="management-dashboard" component={ManagementDashboard} options={{ header: () => <Header title="Management Dashbord" showBack={false} /> }} />
      <Stack.Screen name="manage-users" component={ManageUsers} options={{ header: () => <Header title="Manage User" showBack={false} /> }} />
      <Stack.Screen name="create-announcement" component={CreateAnnouncement} options={{ header: () => <Header title="Create Announcement" showBack={false} /> }} />
    </Stack.Navigator>
  );
};

export default MainStack;