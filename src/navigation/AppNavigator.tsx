import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { HomeScreen, RecordScreen, DetailScreen, SettingsScreen } from '../screens';

export type RootStackParamList = {
  Home: undefined;
  Record: undefined;
  Detail: { meetingId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const getPrefix = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + '/';
  }
  return 'meetingai://';
};

export const AppNavigator: React.FC = () => {
  // The marketing site lives in /landing and is deployed separately.
  // The Expo application always starts at the product workspace.
  const homePath = Platform.OS === 'web' ? 'app' : '';

  return (
    <NavigationContainer
      linking={{
        prefixes: [getPrefix(), 'meetingai://'],
        config: {
          screens: {
            Home: homePath,
            Detail: 'detail/:meetingId',
            Settings: 'settings',
            Record: 'record',
          },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
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
