import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, ArrowRight, Wallet, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/contexts/BalanceContext';
import { useRealtimePayoutPlans } from '@/hooks/useRealtimePayoutPlans';
import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import { router } from 'expo-router';

type MessageType = 'user' | 'assistant' | 'system';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  actions?: Action[];
}

interface Action {
  label: string;
  route: string;
  params?: Record<string, string>;
}

export default function AssistantScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const { balance, lockedBalance, availableBalance } = useBalance();
  const { payoutPlans } = useRealtimePayoutPlans();
  const { transactions } = useRealtimeTransactions();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi there! I'm your Planmoni financial assistant. I can help you manage your finances, optimize your payout plans, and answer questions about your account. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Dismiss keyboard on mobile
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
    
    try {
      // Get financial context for the AI
      const financialContext = {
        balance,
        lockedBalance,
        availableBalance,
        activePlans: payoutPlans.filter(plan => plan.status === 'active').length,
        totalPlans: payoutPlans.length,
        recentTransactions: transactions.slice(0, 5).map(t => ({
          type: t.type,
          amount: t.amount,
          status: t.status,
          date: new Date(t.created_at).toLocaleDateString()
        }))
      };
      
      // Call the AI assistant API
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          financialContext,
          userId: session?.user?.id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const data = await response.json();
      
      // Parse actions if they exist
      let actions: Action[] = [];
      if (data.actions && Array.isArray(data.actions)) {
        actions = data.actions;
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date(),
        actions
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an issue processing your request. Please try again later.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionPress = (action: Action) => {
    if (action.route) {
      router.push({
        pathname: action.route,
        params: action.params
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    
    return (
      <View 
        key={message.id} 
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Bot size={24} color={colors.primary} />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.assistantBubble, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundTertiary }]
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : [styles.assistantMessageText, { color: colors.text }]
          ]}>
            {message.content}
          </Text>
          
          {message.actions && message.actions.length > 0 && (
            <View style={styles.actionsContainer}>
              {message.actions.map((action, index) => (
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
        
        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {session?.user?.user_metadata?.first_name?.[0] || 'U'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    financialSummary: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    toggleButton: {
      padding: 4,
    },
    summaryContent: {
      gap: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    messagesContainer: {
      flex: 1,
      padding: 16,
    },
    messageContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      maxWidth: '100%',
    },
    userMessageContainer: {
      justifyContent: 'flex-end',
    },
    assistantMessageContainer: {
      justifyContent: 'flex-start',
    },
    avatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundTertiary,
      marginHorizontal: 8,
    },
    userAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userAvatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    messageBubble: {
      borderRadius: 16,
      padding: 12,
      maxWidth: '70%',
    },
    userBubble: {
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    assistantMessageText: {
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
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      height: 48,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    },
    loadingText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.textSecondary,
    },
    suggestionContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    suggestionButton: {
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.text,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Assistant</Text>
        <Text style={styles.headerSubtitle}>Ask me anything about your finances</Text>
      </View>
      
      {showFinancialSummary && (
        <View style={styles.financialSummary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Your Financial Summary</Text>
            <Pressable 
              style={styles.toggleButton}
              onPress={() => setShowFinancialSummary(false)}
            >
              <ChevronUp size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabel}>
                <Wallet size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.summaryLabel}>Available Balance</Text>
              </View>
              <Text style={styles.summaryValue}>₦{availableBalance.toLocaleString()}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabel}>
                <Calendar size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.summaryLabel}>Active Payout Plans</Text>
              </View>
              <Text style={styles.summaryValue}>{payoutPlans.filter(p => p.status === 'active').length}</Text>
            </View>
          </View>
        </View>
      )}
      
      {!showFinancialSummary && (
        <Pressable 
          style={[styles.financialSummary, { padding: 12 }]}
          onPress={() => setShowFinancialSummary(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.summaryTitle}>Your Financial Summary</Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </View>
        </Pressable>
      )}
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
          <Pressable 
            style={[
              styles.sendButton,
              !input.trim() && { opacity: 0.5 }
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        
        <View style={styles.suggestionContainer}>
          <Pressable style={styles.suggestionButton} onPress={() => setInput("How can I optimize my payout plans?")}>
            <Text style={styles.suggestionText}>Optimize my plans</Text>
          </Pressable>
          <Pressable style={styles.suggestionButton} onPress={() => setInput("How much have I saved this month?")}>
            <Text style={styles.suggestionText}>Monthly savings</Text>
          </Pressable>
          <Pressable style={styles.suggestionButton} onPress={() => setInput("When is my next payout?")}>
            <Text style={styles.suggestionText}>Next payout</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}