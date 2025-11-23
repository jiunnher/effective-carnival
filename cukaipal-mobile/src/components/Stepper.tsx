import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  subtitle?: string;
}

export const Stepper: React.FC<StepperProps> = ({ label, value, onChange, subtitle }) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={() => value > 0 && onChange(value - 1)}
          style={[styles.button, value > 0 ? styles.buttonActive : styles.buttonDisabled]}
        >
          <Minus size={14} color={value > 0 ? '#475569' : '#cbd5e1'} strokeWidth={3} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          onPress={() => onChange(value + 1)}
          style={[styles.button, styles.buttonActive, styles.buttonPlus]}
        >
          <Plus size={14} color="#10b981" strokeWidth={3} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  button: {
    padding: 6,
    borderRadius: 6,
  },
  buttonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonDisabled: {
    backgroundColor: 'transparent',
  },
  buttonPlus: {
    backgroundColor: '#ffffff',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    width: 24,
    textAlign: 'center',
  },
});
