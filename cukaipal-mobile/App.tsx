import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthScreen } from './src/screens/AuthScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

function AppContent() {
  const { isAuthenticated, hasActiveSubscription, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!hasActiveSubscription) {
    return <PaywallScreen />;
  }

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});
