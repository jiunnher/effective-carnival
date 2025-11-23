import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Receipt, UserProfile, YearIncome } from '../engine/types';
import { CURRENT_YEAR } from '../engine/taxEngine';
import { storageAdapter } from '../storage/NativeStorageAdapter';

interface AppContextType {
  // Data state
  receipts: Receipt[];
  incomeMap: Record<number, YearIncome>;
  userProfile: UserProfile;
  apiKey: string;
  selectedYear: number;
  isLoading: boolean;

  // Setters
  setSelectedYear: (year: number) => void;
  saveReceipt: (receipt: Receipt) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  updateIncomeMap: (map: Record<number, YearIncome>) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  saveApiKey: (key: string) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Guest',
  status: 'single',
  spouseWorking: true,
  spouseDisabled: false,
  selfDisabled: false,
  kidsUnder18: 0,
  kidsPreU: 0,
  kidsDegree: 0,
  kidsDisabled: 0,
  kidsDisabledDiploma: 0,
  zakat: 0,
  donations: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [incomeMap, setIncomeMap] = useState<Record<number, YearIncome>>({});
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [loadedReceipts, loadedIncome, loadedProfile, loadedKey] = await Promise.all([
          storageAdapter.loadReceipts(),
          storageAdapter.loadIncomeMap(),
          storageAdapter.loadUserProfile(),
          storageAdapter.loadApiKey(),
        ]);

        setReceipts(loadedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIncomeMap(loadedIncome);
        if (loadedProfile) setUserProfile(loadedProfile);
        if (loadedKey) setApiKey(loadedKey);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveReceipt = async (receipt: Receipt) => {
    await storageAdapter.saveReceipt(receipt);
    const updatedReceipts = await storageAdapter.loadReceipts();
    setReceipts(updatedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteReceipt = async (id: string) => {
    await storageAdapter.deleteReceipt(id);
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const updateIncomeMap = async (map: Record<number, YearIncome>) => {
    await storageAdapter.saveIncomeMap(map);
    setIncomeMap(map);
  };

  const updateUserProfile = async (profile: UserProfile) => {
    await storageAdapter.saveUserProfile(profile);
    setUserProfile(profile);
  };

  const saveApiKeyHandler = async (key: string) => {
    await storageAdapter.saveApiKey(key);
    setApiKey(key);
  };

  const clearAllData = async () => {
    await storageAdapter.clearAll();
    setReceipts([]);
    setIncomeMap({});
    setUserProfile(DEFAULT_PROFILE);
    setApiKey('');
  };

  const value: AppContextType = {
    receipts,
    incomeMap,
    userProfile,
    apiKey,
    selectedYear,
    isLoading,
    setSelectedYear,
    saveReceipt,
    deleteReceipt,
    updateIncomeMap,
    updateUserProfile,
    saveApiKey: saveApiKeyHandler,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
