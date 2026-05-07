/**
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AddTaskScreen from './src/screens/AddTaskScreen';
import HomeScreen from './src/screens/HomeScreen';
import ManageTagsScreen from './src/screens/ManageTagsScreen';
import SplashScreen from './src/screens/SplashScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import { loadTasks } from './src/storage/Tasks';
import { getTheme } from './src/utils/theme';
import {
  requestNotificationPermissionsOnLaunch,
  syncTaskNotification,
} from './src/utils/notifications';

const Stack = createStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      await requestNotificationPermissionsOnLaunch();
      const tasks = await loadTasks();
      if (cancelled) {
        return;
      }
      for (const t of tasks) {
        if (!t.completed) {
          await syncTaskNotification(t);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer
          theme={{
            dark: isDarkMode,
            colors: {
              primary: theme.primary,
              background: theme.bg,
              card: theme.card,
              text: theme.text,
              border: theme.border,
              notification: theme.primary,
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '800' },
            },
          }}
        >
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerStyle: { backgroundColor: theme.card },
              headerTitleStyle: { color: theme.text, fontWeight: '700' },
              headerTintColor: theme.headerTint,
            }}
          >
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="HomeScreen"
              component={HomeScreen}
              options={{ title: 'Tasks' }}
            />
            <Stack.Screen
              name="AddTaskScreen"
              component={AddTaskScreen}
              options={({ route }) => {
                const p = route.params as { taskId?: string } | undefined;
                const id = p?.taskId;
                return {
                  title:
                    id != null && String(id) !== '' ? 'Edit task' : 'Add task',
                };
              }}
            />
            <Stack.Screen
              name="TaskDetailScreen"
              component={TaskDetailScreen}
              options={{ title: 'Task' }}
            />
            <Stack.Screen
              name="ManageTagsScreen"
              component={ManageTagsScreen}
              options={{ title: 'Manage tags' }}
            />
            <Stack.Screen
              name="StatisticsScreen"
              component={StatisticsScreen}
              options={{ title: 'Statistics' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
