import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, RecordScreen, DetailScreen, SettingsScreen, LandingScreen } from '../screens';

export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  Record: undefined;
  Detail: { meetingId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

import { Platform } from 'react-native';

const getPrefix = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + '/';
  }
  return 'meetingai://';
};

export const AppNavigator: React.FC = () => {
  const isWeb = Platform.OS === 'web';

  return (
    <NavigationContainer
      linking={{
        prefixes: [getPrefix(), 'meetingai://'],
        config: {
          screens: {
            ...(isWeb
              ? {
                  Landing: '',
                  Home: 'app',
                }
              : {
                  Home: '',
                  Landing: 'landing',
                }),
            Detail: 'detail/:meetingId',
            Settings: 'settings',
            Record: 'record',
          },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName={isWeb ? 'Landing' : 'Home'}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Record"
          component={RecordScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
