import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await this.client.post('/auth/refresh', { refreshToken });
            const { token, refreshToken: newRefreshToken } = response.data;

            await AsyncStorage.setItem(TOKEN_KEY, token);
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

            // Retry all queued requests
            this.failedQueue.forEach((prom) => prom.resolve(token));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];

            // Clear tokens and redirect to login
            await this.clearTokens();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async setTokens(token: string, refreshToken: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async clearTokens() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // File upload
  async uploadFile<T>(url: string, fileUri: string, fieldName: string = 'file') {
    const formData = new FormData();
    formData.append(fieldName, {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
