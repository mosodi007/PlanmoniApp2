import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with better error handling
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Initialize OpenAI client with better error handling
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error('Missing OpenAI API key');
}

const openai = new OpenAI({
  apiKey: openaiApiKey || 'dummy-key',
  dangerouslyAllowBrowser: false // Changed to false for security
});

// Verify user authentication
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Helper function to ensure JSON response
function createJsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// Main API handler
export async function POST(request: Request) {
  try {
    // Check for required environment variables
    if (!openaiApiKey || openaiApiKey === 'dummy-key') {
      console.error('OpenAI API key not configured');
      return createJsonResponse({ 
        error: 'AI service not configured',
        response: "I'm sorry, but the AI service is not properly configured. Please check the server configuration and try again."
      }, 500);
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase not configured');
      return createJsonResponse({ 
        error: 'Database service not configured',
        response: "I'm sorry, but the database service is not properly configured. Please check the server configuration and try again."
      }, 500);
    }

    // Get request data
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return createJsonResponse({ 
        error: 'Invalid request format',
        response: "I'm sorry, but I couldn't understand your request. Please try again."
      }, 400);
    }

    const { message, financialContext, userId } = requestData;

    if (!message) {
      return createJsonResponse({ 
        error: 'Message is required',
        response: "Please provide a message for me to respond to."
      }, 400);
    }

    if (!userId) {
      return createJsonResponse({ 
        error: 'User ID is required',
        response: "Authentication is required to use the AI assistant."
      }, 401);
    }

    // Fetch user profile information with error handling
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else {
        profile = profileData;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }

    // Fetch user's payout plans with error handling
    let payoutPlans = [];
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('payout_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (plansError) {
        console.error('Error fetching payout plans:', plansError);
      } else {
        payoutPlans = plansData || [];
      }
    } catch (error) {
      console.error('Payout plans fetch error:', error);
    }

    // Fetch user's recent transactions with error handling
    let transactions = [];
    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        transactions = transactionsData || [];
      }
    } catch (error) {
      console.error('Transactions fetch error:', error);
    }

    // Prepare context for the AI
    const userName = profile?.first_name || 'User';
    const activePlans = payoutPlans.filter(plan => plan.status === 'active') || [];
    const recentTransactions = transactions || [];

    // Provide default financial context if not provided
    const defaultFinancialContext = {
      availableBalance: 0,
      lockedBalance: 0,
      balance: 0
    };
    const finalFinancialContext = financialContext || defaultFinancialContext;

    // Create system prompt with financial context
    const systemPrompt = `
You are a helpful and knowledgeable financial assistant for Planmoni, a financial app that helps users manage their finances through automated payout plans.

USER CONTEXT:
- Name: ${userName}
- Available Balance: ₦${finalFinancialContext.availableBalance.toLocaleString()}
- Locked Balance: ₦${finalFinancialContext.lockedBalance.toLocaleString()}
- Total Balance: ₦${finalFinancialContext.balance.toLocaleString()}
- Active Payout Plans: ${activePlans.length}
- Total Payout Plans: ${payoutPlans.length}

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

    // Call OpenAI API with better error handling
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
      
      // Provide more specific error messages based on the error type
      let errorMessage = "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
      
      if (openaiError.code === 'invalid_api_key') {
        errorMessage = "The AI service is not properly configured. Please contact support.";
      } else if (openaiError.code === 'rate_limit_exceeded') {
        errorMessage = "I'm currently experiencing high demand. Please try again in a few moments.";
      } else if (openaiError.code === 'insufficient_quota') {
        errorMessage = "The AI service has reached its usage limit. Please contact support.";
      }
      
      return createJsonResponse({ 
        error: 'Failed to get AI response',
        response: errorMessage
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