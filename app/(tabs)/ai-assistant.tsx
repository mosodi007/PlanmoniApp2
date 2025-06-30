import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Keyboard,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/contexts/BalanceContext';
import { Send, Sparkles, ArrowRight, Wallet, TrendingUp, Calendar, Clock, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { router } from 'expo-router';

// Define message types
type MessageType = 'text' | 'plan' | 'insight';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  type: MessageType;
  timestamp: Date;
  metadata?: any;
}

// Suggested prompts for the user
const SUGGESTED_PROMPTS = [
  "I want to save ₦500,000 for rent by September",
  "I earn 200k monthly. Can you help me budget?",
  "How can I improve my savings habits?",
  "Create a plan to save ₦1M in 6 months",
  "Analyze my spending patterns",
  "What's the best way to save for emergencies?",
];

export default function AIAssistantScreen() {
  const { colors, isDark } = useTheme();
  const { session } = useAuth();
  const { balance, lockedBalance } = useBalance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const windowHeight = Dimensions.get('window').height;

  // Set up keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        scrollToBottom();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hi ${session?.user?.user_metadata?.first_name || 'there'}! I'm your financial assistant. I can help you create savings plans, analyze your spending, and provide personalized financial advice. How can I help you today?`,
      sender: 'ai',
      type: 'text',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [session?.user?.user_metadata?.first_name]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      sender: 'user',
      type: 'text',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowSuggestions(false);
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      generateAIResponse(userMessage.content);
    }, 1000);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const generateAIResponse = (userMessage: string) => {
    // Analyze the user message to determine the appropriate response type
    const lowerCaseMessage = userMessage.toLowerCase();
    
    // Check for plan-related queries
    if (
      lowerCaseMessage.includes('save') || 
      lowerCaseMessage.includes('plan') || 
      lowerCaseMessage.includes('budget') ||
      lowerCaseMessage.includes('pay myself') ||
      lowerCaseMessage.includes('earn') && (lowerCaseMessage.includes('monthly') || lowerCaseMessage.includes('weekly'))
    ) {
      generatePlanResponse(userMessage);
    } 
    // Check for analysis-related queries
    else if (
      lowerCaseMessage.includes('analyze') || 
      lowerCaseMessage.includes('pattern') || 
      lowerCaseMessage.includes('spending') ||
      lowerCaseMessage.includes('habits') ||
      lowerCaseMessage.includes('improve')
    ) {
      generateInsightResponse(userMessage);
    } 
    // Default to text response
    else {
      generateTextResponse(userMessage);
    }
  };

  const generateTextResponse = (userMessage: string) => {
    // Simple text response
    const responses = [
      "I'd be happy to help with that. Could you provide more details about your financial goals?",
      "That's a great question. Based on your current financial situation, I'd recommend focusing on building an emergency fund first.",
      "I understand your concern. Many people struggle with similar financial challenges. Let's work on a plan together.",
      "Based on your wallet activity, I notice you tend to save more at the beginning of the month. That's a good habit to maintain!",
      "Have you considered setting up automatic transfers to your savings? This can help make saving more consistent.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: randomResponse,
      sender: 'ai',
      type: 'text',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const generatePlanResponse = (userMessage: string) => {
    // Generate a savings plan based on the user's message
    const targetAmount = extractAmount(userMessage) || 500000;
    const timeframe = extractTimeframe(userMessage) || 6; // months
    
    // Calculate monthly and weekly amounts
    const monthlyAmount = Math.ceil(targetAmount / timeframe);
    const weeklyAmount = Math.ceil(monthlyAmount / 4.33);
    const biweeklyAmount = Math.ceil(monthlyAmount / 2);
    
    // Create plan options
    const planOptions = [
      {
        title: "Weekly Plan",
        amount: weeklyAmount,
        frequency: "weekly",
        description: `₦${weeklyAmount.toLocaleString()} every week for ${timeframe} months`
      },
      {
        title: "Bi-weekly Plan",
        amount: biweeklyAmount,
        frequency: "biweekly",
        description: `₦${biweeklyAmount.toLocaleString()} every two weeks for ${timeframe} months`
      },
      {
        title: "Monthly Plan",
        amount: monthlyAmount,
        frequency: "monthly",
        description: `₦${monthlyAmount.toLocaleString()} every month for ${timeframe} months`
      }
    ];
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: `Based on your goal to save ₦${targetAmount.toLocaleString()} over ${timeframe} months, I've created these personalized plans for you:`,
      sender: 'ai',
      type: 'plan',
      timestamp: new Date(),
      metadata: {
        targetAmount,
        timeframe,
        plans: planOptions
      }
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const generateInsightResponse = (userMessage: string) => {
    // Generate insights based on user's financial data
    const insights = [
      {
        title: "Spending Pattern",
        value: "Inconsistent",
        change: "-15%",
        description: "Your spending tends to increase in the third week of each month."
      },
      {
        title: "Savings Rate",
        value: "18%",
        change: "+3%",
        description: "You're saving more than last month, great job!"
      },
      {
        title: "Emergency Fund",
        value: `₦${(balance * 0.2).toLocaleString()}`,
        change: "2 months",
        description: "Your emergency fund covers about 2 months of expenses."
      }
    ];
    
    const recommendations = [
      "Try switching to a bi-weekly payout schedule to better align with your spending patterns",
      "Consider increasing your emergency fund to cover 3-6 months of expenses",
      "Setting up automatic transfers can help maintain consistent savings"
    ];
    
    const aiMessage: Message = {
      id: Date.now().toString(),
      content: "I've analyzed your financial data and here are some insights:",
      sender: 'ai',
      type: 'insight',
      timestamp: new Date(),
      metadata: {
        insights,
        recommendations
      }
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  // Helper functions to extract information from user messages
  const extractAmount = (message: string): number | null => {
    const amountRegex = /₦?(\d{1,3}(,\d{3})*|\d+)(k|K|m|M)?/;
    const match = message.match(amountRegex);
    
    if (!match) return null;
    
    let amount = parseFloat(match[1].replace(/,/g, ''));
    
    // Handle k/K (thousands) and m/M (millions)
    if (match[3]) {
      if (match[3].toLowerCase() === 'k') {
        amount *= 1000;
      } else if (match[3].toLowerCase() === 'm') {
        amount *= 1000000;
      }
    }
    
    return amount;
  };

  const extractTimeframe = (message: string): number | null => {
    // Look for time periods like "6 months", "1 year", "by September", etc.
    const monthRegex = /(\d+)\s*(month|months)/i;
    const yearRegex = /(\d+)\s*(year|years)/i;
    
    const monthMatch = message.match(monthRegex);
    if (monthMatch) {
      return parseInt(monthMatch[1]);
    }
    
    const yearMatch = message.match(yearRegex);
    if (yearMatch) {
      return parseInt(yearMatch[1]) * 12;
    }
    
    // Check for month names
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    for (let i = 0; i < months.length; i++) {
      if (message.toLowerCase().includes(months[i])) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const targetMonth = i;
        
        // Calculate months difference, accounting for next year if needed
        let monthsDiff = targetMonth - currentMonth;
        if (monthsDiff <= 0) {
          monthsDiff += 12; // Target is next year
        }
        
        return monthsDiff;
      }
    }
    
    return null;
  };

  const handleCreatePlan = (plan: any) => {
    // Navigate to create payout screen with pre-filled values
    router.push({
      pathname: '/create-payout/amount',
      params: {
        amount: plan.metadata.targetAmount.toString(),
        frequency: plan.frequency,
        duration: (plan.metadata.timeframe * 4).toString() // Convert months to weeks
      }
    });
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.sender === 'user';
    
    // Render different message types
    switch (message.type) {
      case 'text':
        return (
          <Animated.View 
            key={message.id} 
            entering={FadeIn.duration(300)} 
            layout={Layout.springify()}
            style={[
              styles.messageBubble,
              isUser ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.aiBubble, { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary }]
            ]}
          >
            <Text style={[
              styles.messageText,
              isUser ? styles.userText : [styles.aiText, { color: colors.text }]
            ]}>
              {message.content}
            </Text>
          </Animated.View>
        );
        
      case 'plan':
        return (
          <Animated.View 
            key={message.id} 
            entering={FadeIn.duration(300)} 
            layout={Layout.springify()}
            style={[
              styles.messageBubble,
              styles.aiBubble,
              styles.planBubble,
              { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary }
            ]}
          >
            <Text style={[styles.messageText, styles.aiText, { color: colors.text }]}>
              {message.content}
            </Text>
            
            <View style={styles.planOptions}>
              {message.metadata.plans.map((plan: any, i: number) => (
                <View key={i} style={[styles.planOption, { backgroundColor: isDark ? colors.backgroundSecondary : colors.card }]}>
                  <View style={styles.planHeader}>
                    <View style={styles.planTitleContainer}>
                      <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
                      <Text style={[styles.planAmount, { color: colors.primary }]}>
                        ₦{plan.amount.toLocaleString()}
                      </Text>
                    </View>
                    {plan.frequency === 'weekly' && <Calendar size={20} color={colors.primary} />}
                    {plan.frequency === 'biweekly' && <Calendar size={20} color={colors.primary} />}
                    {plan.frequency === 'monthly' && <Calendar size={20} color={colors.primary} />}
                  </View>
                  
                  <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                    {plan.description}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.planButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleCreatePlan({...plan, metadata: message.metadata})}
                  >
                    <Text style={styles.planButtonText}>Create Plan</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Animated.View>
        );
        
      case 'insight':
        return (
          <Animated.View 
            key={message.id} 
            entering={FadeIn.duration(300)} 
            layout={Layout.springify()}
            style={[
              styles.messageBubble,
              styles.aiBubble,
              styles.insightBubble,
              { backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary }
            ]}
          >
            <Text style={[styles.messageText, styles.aiText, { color: colors.text }]}>
              {message.content}
            </Text>
            
            <View style={styles.insightsContainer}>
              {message.metadata.insights.map((insight: any, i: number) => (
                <View key={i} style={[styles.insightCard, { backgroundColor: isDark ? colors.backgroundSecondary : colors.card }]}>
                  <View style={styles.insightHeader}>
                    <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
                    <Text style={[styles.insightValue, { color: colors.primary }]}>{insight.value}</Text>
                  </View>
                  <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
                    {insight.description}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.recommendationsContainer}>
              <Text style={[styles.recommendationsTitle, { color: colors.text }]}>Recommendations:</Text>
              {message.metadata.recommendations.map((recommendation: string, i: number) => (
                <View key={i} style={styles.recommendationItem}>
                  <View style={[styles.recommendationBullet, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        );
        
      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    aiIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messagesContainer: {
      flex: 1,
      padding: 16,
    },
    messageRow: {
      marginBottom: 16,
      maxWidth: '80%',
    },
    userMessageRow: {
      alignSelf: 'flex-end',
    },
    aiMessageRow: {
      alignSelf: 'flex-start',
    },
    messageBubble: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 8,
      maxWidth: '80%',
    },
    userBubble: {
      alignSelf: 'flex-end',
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 4,
    },
    planBubble: {
      width: '95%',
    },
    insightBubble: {
      width: '95%',
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
    },
    userText: {
      color: '#FFFFFF',
    },
    aiText: {
      color: colors.text,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 16,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: 20,
      padding: 12,
      paddingHorizontal: 16,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginRight: 4,
    },
    typingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      marginRight: 8,
      maxHeight: 120,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
    suggestionsContainer: {
      padding: 16,
      backgroundColor: colors.surface,
    },
    suggestionsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
    },
    suggestionsScroll: {
      flexDirection: 'row',
    },
    suggestionBubble: {
      backgroundColor: isDark ? colors.backgroundTertiary : colors.backgroundSecondary,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    suggestionText: {
      fontSize: 14,
      color: colors.text,
    },
    planOptions: {
      marginTop: 16,
      gap: 12,
    },
    planOption: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    planTitleContainer: {
      flex: 1,
    },
    planTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    planAmount: {
      fontSize: 18,
      fontWeight: '700',
    },
    planDescription: {
      fontSize: 14,
      marginBottom: 16,
    },
    planButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 8,
    },
    planButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    insightsContainer: {
      marginTop: 16,
      gap: 12,
    },
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    insightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    insightValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    insightDescription: {
      fontSize: 14,
    },
    recommendationsContainer: {
      marginTop: 16,
      backgroundColor: isDark ? colors.backgroundSecondary : colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recommendationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    recommendationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    recommendationBullet: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
      marginRight: 8,
    },
    recommendationText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyImage: {
      width: 120,
      height: 120,
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Financial Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by AI</Text>
        </View>
        <View style={styles.aiIconContainer}>
          <Sparkles size={20} color="#FFFFFF" />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, index) => renderMessage(message, index))}
          
          {isTyping && (
            <Animated.View 
              entering={FadeIn.duration(300)} 
              exiting={FadeOut.duration(300)}
              style={styles.typingIndicator}
            >
              <Animated.View style={styles.typingDot} />
              <Animated.View style={styles.typingDot} />
              <Animated.View style={styles.typingDot} />
              <Text style={styles.typingText}>Thinking...</Text>
            </Animated.View>
          )}
        </ScrollView>

        {showSuggestions && messages.length === 1 && !keyboardVisible && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking about:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionBubble}
                  onPress={() => handleSuggestionPress(prompt)}
                >
                  <Text style={styles.suggestionText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Ask me anything about your finances..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            onFocus={() => setShowSuggestions(false)}
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}