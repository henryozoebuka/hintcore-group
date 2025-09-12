import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Header from '../components/Header/Header';
import Profile from '../pages/Profile/Profile';
import UserDashboard from '../pages/UserDashboard/UserDashboard';
import ManagementDashboard from '../pages/ManagementDashboard/ManagementDashboard';
import ManageUsers from '../pages/ManageUsers/ManageUsers';
import CreateAnnouncement from '../pages/CreateAnnouncement/CreateAnnouncement';
import ManageAnnouncements from '../pages/ManageAnnouncements/ManageAnnouncements';
import ManageAnnouncement from '../pages/ManageAnnoucement/ManageAnnoucement';
import Settings from '../pages/Settings/Settings';
import ManageEditAnnouncement from '../pages/ManageEditAnnouncement/ManageEditAnnouncement';
import Announcements from '../pages/Announcements/Announcements';
import Announcement from '../pages/Announcement/Announcement';
import EditProfile from '../pages/EditProfile/EditProfile';
import CreateConstitution from '../pages/CreateConstitution/CreateConstitution';
import Constitutions from '../pages/Constitutions/Constitutions';
import Constitution from '../pages/Constitution/Constitution';
import ManageConstitutions from '../pages/ManageConstitutions/ManageConstitutions';
import ManageConstitution from '../pages/ManageConstitution/ManageConstitution';
import ManageEditConstitution from '../pages/ManageEditConstitution/ManageEditConstitution';
import CreatePayment from '../pages/CreatePayment/CreatePayment';
import ManagePayments from '../pages/ManagePayments/ManagePayments';
import ManagePayment from '../pages/ManagePayment/ManagePayment';
import Payments from '../pages/Payments/Payments';
import ManageEditPayment from '../pages/ManageEditPayment/ManageEditPayment';
import Payment from '../pages/Payment/Payment';
import CreateAnotherGroup from '../pages/CreateAnotherGroup/CreateAnotherGroup';
import MinutesRecords from '../pages/MinutesRecords/MinutesRecords';
import Minutes from '../pages/Minutes/Minutes';
import ManageMinutesRecords from '../pages/ManageMinutesRecords/ManageMinutesRecords';
import ManageMinutes from '../pages/ManageMinutes/ManageMinutes';
import CreateMinutes from '../pages/CreateMinutes/CreateMinutes';
import ManageEditMinutes from '../pages/ManageEditMinutes/ManageEditMinutes';
import GroupInformation from '../pages/GroupInformation/GroupInformation';
import ManageEditGroupInformation from '../pages/ManageEditGroupInformation/ManageEditGroupInformation';

const Stack = createStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator initialRouteName="user-dashboard">
      <Stack.Screen name="create-another-group" component={CreateAnotherGroup} options={{ header: () => <Header title="Create Another Group" showBack={false} /> }} />
      <Stack.Screen name="group-information" component={GroupInformation} options={{ header: () => <Header title="Group Information" showBack={false} /> }} />
      <Stack.Screen name="manage-edit-group-information" component={ManageEditGroupInformation} options={{ header: () => <Header title="Manage Edit Group Information" showBack={false} /> }} />
      
      <Stack.Screen name="settings" component={Settings} options={{ header: () => <Header title="Settings" showBack={false} /> }} />
      <Stack.Screen name="profile" component={Profile} options={{ header: () => <Header title="My Profile" showBack={false} /> }} />
      <Stack.Screen name="edit-profile" component={EditProfile} options={{ header: () => <Header title="Edit Profile" showBack={false} /> }} />
      <Stack.Screen name="user-dashboard" component={UserDashboard} options={{ header: () => <Header title="My Dashbord" showBack={false} /> }} />
      <Stack.Screen name="management-dashboard" component={ManagementDashboard} options={{ header: () => <Header title="Management Dashbord" showBack={false} /> }} />
      <Stack.Screen name="manage-users" component={ManageUsers} options={{ header: () => <Header title="Manage User" showBack={false} /> }} />
      
      <Stack.Screen name="create-announcement" component={CreateAnnouncement} options={{ header: () => <Header title="Create Announcement" showBack={false} /> }} />
      <Stack.Screen name="announcements" component={Announcements} options={{ header: () => <Header title="Announcements" showBack={false} /> }} />
      <Stack.Screen name="announcement" component={Announcement} options={{ header: () => <Header title="Announcement" showBack={false} /> }} />
      <Stack.Screen name="manage-announcements" component={ManageAnnouncements} options={{ header: () => <Header title="Manage Announcements" showBack={false} /> }} />
      <Stack.Screen name="manage-announcement" component={ManageAnnouncement} options={{ header: () => <Header title="Manage Announcement" showBack={false} /> }} />
      <Stack.Screen name="manage-edit-announcement" component={ManageEditAnnouncement} options={{ header: () => <Header title="Edit Announcement" showBack={false} /> }} />
      
      <Stack.Screen name="create-constitution" component={CreateConstitution} options={{ header: () => <Header title="Create Constitution" showBack={false} /> }} />
      <Stack.Screen name="constitutions" component={Constitutions} options={{ header: () => <Header title="Constitutions" showBack={false} /> }} />
      <Stack.Screen name="constitution" component={Constitution} options={{ header: () => <Header title="Constitution" showBack={false} /> }} />
      <Stack.Screen name="manage-constitutions" component={ManageConstitutions} options={{ header: () => <Header title="Manage Constitutions" showBack={false} /> }} />
      <Stack.Screen name="manage-constitution" component={ManageConstitution} options={{ header: () => <Header title="Manage Constitution" showBack={false} /> }} />
      <Stack.Screen name="manage-edit-constitution" component={ManageEditConstitution} options={{ header: () => <Header title="Edit Constitution" showBack={false} /> }} />

      
      <Stack.Screen name="create-minutes" component={CreateMinutes} options={{ header: () => <Header title="Create Minutes" showBack={false} /> }} />
      <Stack.Screen name="minutes-records" component={MinutesRecords} options={{ header: () => <Header title="Constitutions" showBack={false} /> }} />
      <Stack.Screen name="minutes" component={Minutes} options={{ header: () => <Header title="Constitution" showBack={false} /> }} />
      <Stack.Screen name="manage-minutes-records" component={ManageMinutesRecords} options={{ header: () => <Header title="Manage Constitutions" showBack={false} /> }} />
      <Stack.Screen name="manage-minutes" component={ManageMinutes} options={{ header: () => <Header title="Manage Constitution" showBack={false} /> }} />
      <Stack.Screen name="manage-edit-minutes" component={ManageEditMinutes} options={{ header: () => <Header title="Edit Minutes" showBack={false} /> }} />

      
      
      
      
      
      
      
      <Stack.Screen name="create-payment" component={CreatePayment} options={{ header: () => <Header title="Create Payment" showBack={false} /> }} />
      <Stack.Screen name="manage-payments" component={ManagePayments} options={{ header: () => <Header title="Manage Payments" showBack={false} /> }} />
      <Stack.Screen name="manage-payment" component={ManagePayment} options={{ header: () => <Header title="Manage Payment" showBack={false} /> }} />
      <Stack.Screen name="manage-edit-payment" component={ManageEditPayment} options={{ header: () => <Header title="Manage Edit Payment" showBack={false} /> }} />
      <Stack.Screen name="payments" component={Payments} options={{ header: () => <Header title="Payments" showBack={false} /> }} />
      <Stack.Screen name="payment" component={Payment} options={{ header: () => <Header title="Payment" showBack={false} /> }} />
    </Stack.Navigator>
  );
};

export default MainStack;