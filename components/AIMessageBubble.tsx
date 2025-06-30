import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

interface Action {
  label: string;
  route: string;
  params?: Record<string, string>;
}

interface AIMessageBubbleProps {
  message: string;
  actions?: Action[];
}

export default function AIMessageBubble({ message, actions }: AIMessageBubbleProps) {
  const { colors, isDark } = useTheme();
  
  const handleActionPress = (action: Action) => {
    if (action.route) {
      router.push({
        pathname: action.route,
        params: action.params
      });
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      maxWidth: '80%',
      alignSelf: 'flex-start',
    },
    messageBubble: {
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundTertiary,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      padding: 12,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
    },
    actionsContainer: {
      marginTop: 12,
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{message}</Text>
        
        {actions && actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <Pressable 
                key={index}
                style={styles.actionButton}
                onPress={() => handleActionPress(action)}
              >
                <Text style={styles.actionButtonText}>{action.label}</Text>
                <ArrowRight size={16} color={colors.primary} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}