import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface UserMessageBubbleProps {
  message: string;
}

export default function UserMessageBubble({ message }: UserMessageBubbleProps) {
  const { colors } = useTheme();
  const { session } = useAuth();
  
  const firstName = session?.user?.user_metadata?.first_name || 'U';
  const lastName = session?.user?.user_metadata?.last_name || '';
  const initials = firstName[0] + (lastName ? lastName[0] : '');
  
  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
      maxWidth: '85%',
      alignSelf: 'flex-end',
      flexDirection: 'row',
    },
    avatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#1E3A8A',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      alignSelf: 'flex-start',
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
    },
    messageBubble: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      borderTopRightRadius: 4,
      padding: 16,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      </View>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
  );
}