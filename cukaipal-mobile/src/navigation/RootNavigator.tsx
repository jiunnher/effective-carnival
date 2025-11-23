import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Archive, User, PlusCircle } from 'lucide-react-native';
import { Pressable, View, StyleSheet } from 'react-native';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { VaultScreen } from '../screens/VaultScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type RootTabParamList = {
  Dashboard: undefined;
  Vault: undefined;
  Profile: undefined;
  AddReceipt: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          backgroundColor: '#ffffff',
          height: 70,
          paddingTop: 8,
          paddingBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Vault"
        component={VaultScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Archive size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButton}>
              <View
                style={[
                  styles.centerButtonInner,
                  focused && styles.centerButtonInnerActive,
                ]}
              >
                <PlusCircle size={32} color="#ffffff" />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={24} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  centerButton: {
    position: 'absolute',
    top: -30,
  },
  centerButtonInner: {
    backgroundColor: '#10b981',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#f8fafc',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  centerButtonInnerActive: {
    transform: [{ scale: 0.95 }],
  },
});
