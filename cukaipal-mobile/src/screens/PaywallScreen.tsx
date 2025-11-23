import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CheckCircle2, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import Purchases from 'react-native-purchases';
import { SUBSCRIPTION_PRODUCTS } from '../config/api';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

const PLANS: PricingPlan[] = [
  {
    id: SUBSCRIPTION_PRODUCTS.MONTHLY,
    name: 'Monthly',
    price: 'RM 9.90',
    period: '/month',
    features: [
      'Unlimited receipts',
      'AI-powered OCR',
      'Cloud sync',
      'PDF & CSV export',
      'Tax calculations',
      'Priority support',
    ],
  },
  {
    id: SUBSCRIPTION_PRODUCTS.YEARLY,
    name: 'Yearly',
    price: 'RM 99',
    period: '/year',
    savings: 'Save 17%',
    popular: true,
    features: [
      'Everything in Monthly',
      'Advanced tax insights',
      'Year-over-year analysis',
      'Premium support',
      'Early access to features',
      'Family sharing (up to 5)',
    ],
  },
];

interface PaywallScreenProps {
  onClose?: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({ onClose }) => {
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PRODUCTS.YEARLY);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // Get available offerings from RevenueCat
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        throw new Error('No subscription offerings available');
      }

      // Find the package that matches the selected plan
      const availablePackages = offerings.current.availablePackages;
      const packageToPurchase = availablePackages.find(
        pkg => pkg.product.identifier === selectedPlan
      );

      if (!packageToPurchase) {
        throw new Error('Selected subscription plan not available');
      }

      // Purchase the package
      const purchaseResult = await Purchases.purchasePackage(packageToPurchase);

      if (purchaseResult.customerInfo.entitlements.active['pro']) {
        await refreshUser();
        Alert.alert('Success', 'Welcome to CukaiPal Pro!');
        onClose?.();
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Could not complete purchase');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['pro']) {
        await refreshUser();
        Alert.alert('Success', 'Your subscription has been restored!');
        onClose?.();
      } else {
        Alert.alert('No Subscription', 'No active subscription found');
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error.message || 'Could not restore purchases');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {onClose && (
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748b" />
            </Pressable>
          )}
          <Text style={styles.badge}>7-DAY FREE TRIAL</Text>
          <Text style={styles.title}>Unlock Pro Features</Text>
          <Text style={styles.subtitle}>
            Get unlimited access to all features and manage your taxes like a pro
          </Text>
        </View>

        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
                </View>
              )}
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSubscribe}
          style={styles.subscribeButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
          )}
        </Pressable>

        <Pressable onPress={handleRestore} disabled={isLoading} style={styles.restoreButton}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Free trial for 7 days, then {PLANS.find((p) => p.id === selectedPlan)?.price} {PLANS.find((p) => p.id === selectedPlan)?.period}. Cancel anytime. Auto-renewal can be turned off in
          Settings at least 24 hours before the end of the trial period.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  plans: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  planCardPopular: {
    borderColor: '#6366f1',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  savingsBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsBadgeText: {
    color: '#78350f',
    fontSize: 10,
    fontWeight: '700',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1e293b',
  },
  planPeriod: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  planFeatures: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
  },
  subscribeButton: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
});
