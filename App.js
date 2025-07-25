// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RoadmapScreen from './screens/RoadmapScreen';
import DailyPlannerScreen from './screens/DailyPlannerScreen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth } from './firebase'; // ✅ import your auth instance
import CalendarScreen from './screens/CalendarScreen';
import StatsScreen from './screens/StatsScreen';

// 🔔 Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // 🔓 Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Enable notifications to get daily task reminders!');
      }
    };

    // ⏰ Schedule daily reminder at 8 AM
    const scheduleDailyReminder = async () => {
      await Notifications.cancelAllScheduledNotificationsAsync(); // Avoid duplicates
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📋 Check your planner!",
          body: "Don't forget to complete your tasks today!",
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });
    };

    requestPermissions();

    // Only schedule if user is logged in
    if (auth.currentUser) {
      scheduleDailyReminder();
    }
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Signup">
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Roadmap" component={RoadmapScreen} />
        <Stack.Screen name="DailyPlanner" component={DailyPlannerScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
