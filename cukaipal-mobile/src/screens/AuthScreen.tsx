import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginScreen onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupScreen onSwitchToLogin={() => setIsLogin(true)} />
  );
};
