import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
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
      marginVertical: 8,
      maxWidth: '85%',
      alignSelf: 'flex-start',
      flexDirection: 'row',
    },
    avatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      alignSelf: 'flex-start',
    },
    contentContainer: {
      flex: 1,
    },
    messageBubble: {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
      borderRadius: 16,
      borderTopLeftRadius: 4,
      padding: 16,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
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
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Sparkles size={18} color="#FFFFFF" />
      </View>
      <View style={styles.contentContainer}>
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
    </View>
  );
}