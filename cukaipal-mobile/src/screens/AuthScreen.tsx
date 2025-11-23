import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Could not sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithApple();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Could not sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CukaiPal</Text>
          </View>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Your Malaysian tax relief assistant{'\n'}Manage taxes effortlessly
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📸</Text>
            <Text style={styles.featureText}>AI-powered receipt scanning</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>☁️</Text>
            <Text style={styles.featureText}>Cloud sync across devices</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Automatic tax calculations</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎁</Text>
            <Text style={styles.featureText}>7-day free trial included</Text>
          </View>
        </View>

        {/* Sign In Buttons */}
        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={handleAppleSignIn}
              style={[styles.button, styles.appleButton]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.appleIcon}></Text>
                  <Text style={styles.buttonText}>Continue with Apple</Text>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={handleGoogleSignIn}
            style={[styles.button, styles.googleButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1e293b" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={[styles.buttonText, styles.googleButtonText]}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    gap: 20,
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  buttons: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  appleIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  googleButtonText: {
    color: '#1e293b',
  },
  terms: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#10b981',
    fontWeight: '600',
  },
});
