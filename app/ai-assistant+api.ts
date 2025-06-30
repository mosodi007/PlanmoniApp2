import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true // Only for demo purposes
});

// Verify user authentication
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

// Helper function to ensure JSON response
function createJsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Main API handler
export async function POST(request: Request) {
  try {
    // Get request data
    const { message, financialContext, userId } = await request.json();

    if (!message) {
      return createJsonResponse({ error: 'Message is required' }, 400);
    }

    // Fetch user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Fetch user's payout plans
    const { data: payoutPlans, error: plansError } = await supabase
      .from('payout_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (plansError) {
      console.error('Error fetching payout plans:', plansError);
    }

    // Fetch user's recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    // Prepare context for the AI
    const userName = profile?.first_name || 'User';
    const activePlans = payoutPlans?.filter(plan => plan.status === 'active') || [];
    const recentTransactions = transactions || [];

    // Create system prompt with financial context
    const systemPrompt = `
You are a helpful and knowledgeable financial assistant for Planmoni, a financial app that helps users manage their finances through automated payout plans.

USER CONTEXT:
- Name: ${userName}
- Available Balance: ₦${financialContext.availableBalance.toLocaleString()}
- Locked Balance: ₦${financialContext.lockedBalance.toLocaleString()}
- Total Balance: ₦${financialContext.balance.toLocaleString()}
- Active Payout Plans: ${activePlans.length}
- Total Payout Plans: ${payoutPlans?.length || 0}

PAYOUT PLANS:
${activePlans.map(plan => `- ${plan.name}: ₦${plan.payout_amount} ${plan.frequency}, ${plan.completed_payouts}/${plan.duration} completed`).join('\n')}

RECENT TRANSACTIONS:
${recentTransactions.slice(0, 5).map(tx => `- ${tx.type.toUpperCase()}: ₦${tx.amount} (${tx.status}) on ${new Date(tx.created_at).toLocaleDateString()}`).join('\n')}

IMPORTANT GUIDELINES:
1. Be concise, practical, and personalized in your advice.
2. Focus on helping the user manage their finances better using Planmoni's features.
3. When appropriate, suggest specific actions the user can take in the app.
4. If you recommend creating a payout plan, suggest they go to the Home tab and tap "Plan".
5. If you recommend adding funds, suggest they go to the Home tab and tap "Deposit".
6. Always be respectful of the user's financial situation.
7. Don't make up information - only use the context provided.
8. If you don't know something, say so honestly.

For certain actions, you can provide actionable buttons by including a JSON array in your response like this:
\`\`\`json
[
  {
    "label": "Create Payout Plan",
    "route": "/create-payout/amount"
  },
  {
    "label": "Add Funds",
    "route": "/add-funds"
  }
]
\`\`\`

Only include these actions when they're directly relevant to your response.
`;

    // Call OpenAI API
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";
      
      // Extract actions if present
      let actions = [];
      try {
        const actionMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
        if (actionMatch && actionMatch[1]) {
          actions = JSON.parse(actionMatch[1]);
          // Remove the JSON block from the response
          const cleanResponse = aiResponse.replace(/```json\n[\s\S]*?\n```/, '').trim();
          return createJsonResponse({ 
            response: cleanResponse,
            actions
          });
        }
      } catch (parseError) {
        console.error('Error parsing actions from AI response:', parseError);
      }

      return createJsonResponse({ response: aiResponse });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return createJsonResponse({ 
        error: 'Failed to get AI response',
        response: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later."
      }, 500);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return createJsonResponse({ 
      error: 'Internal server error',
      response: "I apologize, but I encountered an unexpected error. Please try again later."
    }, 500);
  }
}