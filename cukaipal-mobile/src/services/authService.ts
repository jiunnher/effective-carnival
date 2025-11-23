import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    subscriptionStatus: 'active' | 'trial' | 'expired' | 'none';
    subscriptionPlan?: string;
    trialEndsAt?: string;
  };
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    await apiClient.setTokens(response.token, response.refreshToken);
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
    await apiClient.setTokens(response.token, response.refreshToken);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await apiClient.clearTokens();
    }
  }

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  }

  async resetPassword(data: ResetPasswordData): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  async getCurrentUser() {
    const token = await apiClient.getToken();
    if (!token) return null;

    try {
      return await apiClient.get<AuthResponse['user']>(API_ENDPOINTS.USER.PROFILE);
    } catch (error) {
      return null;
    }
  }

  async updateProfile(data: Partial<AuthResponse['user']>) {
    return await apiClient.put<AuthResponse['user']>(API_ENDPOINTS.USER.UPDATE_PROFILE, data);
  }

  async deleteAccount(): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.USER.DELETE_ACCOUNT);
    await apiClient.clearTokens();
  }
}

export const authService = new AuthService();
