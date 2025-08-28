import React from 'react';
import RootNavigator from './navigations/RootNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux'
import store from './redux/store.js'

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaView style={{flex: 1}}>
        <RootNavigator />
      </SafeAreaView>
    </Provider>
  );
}

export default App;