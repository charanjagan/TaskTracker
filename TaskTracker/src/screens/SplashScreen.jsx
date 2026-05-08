import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getTheme, typography } from '../utils/theme';

const SPLASH_MS = 2000;

export default function SplashScreen() {
  const theme = getTheme();
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('MainTabs');
    }, SPLASH_MS);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.primary}
      />
      <Text style={[styles.title, { color: theme.onPrimary }]}>TaskTracker</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    letterSpacing: -0.5,
  },
});
