/**
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, StyleSheet, Text } from 'react-native';
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
const Tab = createBottomTabNavigator();

const TAB_ICON = {
  HomeTab: '⌂',
  SearchTab: '⌕',
  StatsTab: '◔',
  SettingsTab: '⚙',
} as const;

function MainTabs() {
  const theme = getTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
        headerTintColor: theme.headerTint,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => (
          <Text
            style={{
              color,
              fontSize: focused ? 14 : 13,
              fontWeight: focused ? '800' : '600',
              marginBottom: 1,
            }}
          >
            {TAB_ICON[route.name as keyof typeof TAB_ICON] ?? 'O'}
          </Text>
        ),
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', headerTitle: 'Tasks' }}
      />
      <Tab.Screen
        name="SearchTab"
        component={HomeScreen}
        options={{ title: 'Search', headerTitle: 'Search tasks' }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatisticsScreen}
        options={{ title: 'Stats', headerTitle: 'Statistics' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={ManageTagsScreen}
        options={{ title: 'Settings', headerTitle: 'Manage tags' }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const theme = getTheme();

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
        <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
        <NavigationContainer
          theme={{
            dark: true,
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
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
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
