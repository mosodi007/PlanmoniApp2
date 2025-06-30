import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/contexts/BalanceContext';
import { useRealtimePayoutPlans } from '@/hooks/useRealtimePayoutPlans';
import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';

interface Action {
  label: string;
  route: string;
  params?: Record<string, string>;
}

interface AIResponse {
  response: string;
  actions?: Action[];
}

export function useAIAssistant() {
  const { session } = useAuth();
  const { balance, lockedBalance, availableBalance } = useBalance();
  const { payoutPlans } = useRealtimePayoutPlans();
  const { transactions } = useRealtimeTransactions();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAssistantResponse = async (message: string): Promise<AIResponse> => {
    setIsLoading(true);
    setError(null);
    
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
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          message,
          financialContext,
          userId: session?.user?.id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return {
        response: "I apologize, but I encountered an issue processing your request. Please try again later."
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAssistantResponse,
    isLoading,
    error
  };
}