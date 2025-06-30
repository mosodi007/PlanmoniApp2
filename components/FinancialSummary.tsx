import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Wallet, Calendar, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useBalance } from '@/contexts/BalanceContext';
import { useRealtimePayoutPlans } from '@/hooks/useRealtimePayoutPlans';

interface FinancialSummaryProps {
  compact?: boolean;
}

export default function FinancialSummary({ compact = false }: FinancialSummaryProps) {
  const { colors } = useTheme();
  const { balance, lockedBalance, availableBalance } = useBalance();
  const { payoutPlans } = useRealtimePayoutPlans();
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  const activePlans = payoutPlans.filter(p => p.status === 'active').length;
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: compact ? 12 : 16,
      margin: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isExpanded ? 12 : 0,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    toggleButton: {
      padding: 4,
    },
    content: {
      gap: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    value: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Financial Summary</Text>
        <Pressable 
          style={styles.toggleButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp size={20} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={20} color={colors.textSecondary} />
          )}
        </Pressable>
      </View>
      
      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Wallet size={16} color={colors.textSecondary} />
              <Text style={styles.label}>Available Balance</Text>
            </View>
            <Text style={styles.value}>₦{availableBalance.toLocaleString()}</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Wallet size={16} color={colors.textSecondary} />
              <Text style={styles.label}>Locked Balance</Text>
            </View>
            <Text style={styles.value}>₦{lockedBalance.toLocaleString()}</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Calendar size={16} color={colors.textSecondary} />
              <Text style={styles.label}>Active Payout Plans</Text>
            </View>
            <Text style={styles.value}>{activePlans}</Text>
          </View>
        </View>
      )}
    </View>
  );
}