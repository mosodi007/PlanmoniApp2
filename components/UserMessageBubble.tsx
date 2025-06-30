import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface UserMessageBubbleProps {
  message: string;
}

export default function UserMessageBubble({ message }: UserMessageBubbleProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      maxWidth: '80%',
      alignSelf: 'flex-end',
    },
    messageBubble: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      borderBottomRightRadius: 4,
      padding: 12,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </View>
  );
}