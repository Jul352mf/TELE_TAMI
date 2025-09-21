/**
 * Conversation state management for closing triggers and push-back logic
 */

import { emit } from '@/utils/telemetry';

export interface ConversationState {
  recentMessages: string[];
  pushBackHistory: string[];
  lastPushBackTurn: number;
  currentTurn: number;
  closingTriggered: boolean;
  strategy?: 'A' | 'B' | 'C' | 'D' | 'E';
}

// Witty push-back pool with variants
const PUSHBACK_VARIANTS = [
  "Come on, work with me here! I just need a few more details to make this lead shine.",
  "Hey now, we're so close! Don't leave me hanging on this one.",
  "Alright, I get it - details can be tedious. But this is the good stuff that closes deals.",
  "I hear you, but trust me - these details separate the pros from the amateurs.",
  "Look, I know this feels like a lot, but we're building something solid here.",
  "Fair enough, but let's not let a great lead slip through our fingers over a few fields.",
  "I promise this is the last push - then we can wrap this beauty up.",
  "Okay, okay - but imagine how good this will look in your pipeline.",
  "Real talk: incomplete leads are just expensive paperwork. Let's finish strong.",
  "I feel you, but we're literally one field away from making this bulletproof."
];

const PUSHBACK_COOLDOWN = 10; // turns
const CLOSING_WINDOW_SIZE = 3; // messages to analyze for closing triggers

/**
 * Detect negative sentiment patterns that might trigger closing
 */
function detectNegativeSentiment(message: string): boolean {
  const negativePatterns = [
    /\b(no|nah|nope|not interested|done|enough|stop|quit|end|finish|leave)\b/i,
  /\b(frustrated|annoyed|annoying|tired|bored|over it)\b/i,
    /\b(can't|won't|don't want|not going to)\b/i,
    /\b(whatever|fine|forget it|skip it)\b/i
  ];
  
  return negativePatterns.some(pattern => pattern.test(message));
}

/**
 * Check if closing should be triggered based on recent message history
 */
export function shouldTriggerClosing(state: ConversationState): { trigger: boolean; reason?: string } {
  if (state.closingTriggered) {
    return { trigger: false };
  }

  // Check for 3 consecutive negative sentiment messages
  if (state.recentMessages.length >= CLOSING_WINDOW_SIZE) {
    const lastThree = state.recentMessages.slice(-CLOSING_WINDOW_SIZE);
    const allNegative = lastThree.every(msg => detectNegativeSentiment(msg));
    
    if (allNegative) {
      return { trigger: true, reason: 'consecutive_negative_sentiment' };
    }
  }

  // Check for explicit completion signals
  const latestMessage = state.recentMessages[state.recentMessages.length - 1] || '';
  if (!/[?]\s*$/.test(latestMessage) && /\b(done|finished|complete|that's all|goodbye|bye|see you)\b/i.test(latestMessage)) {
    return { trigger: true, reason: 'user_completion_signal' };
  }

  return { trigger: false };
}

/**
 * Get a push-back response if conditions are met
 */
export function getPushBackResponse(state: ConversationState): { response?: string; variantId?: string } {
  // Check cooldown
  if (state.currentTurn - state.lastPushBackTurn < PUSHBACK_COOLDOWN) {
    return {};
  }

  // Check if user seems disengaged (basic heuristic)
  const latestMessage = state.recentMessages[state.recentMessages.length - 1] || '';
  const seemsDisengaged = /\b(I don't know|not sure|maybe|whatever|skip)\b/i.test(latestMessage);
  
  if (!seemsDisengaged) {
    return {};
  }

  // Select variant that hasn't been used recently
  const availableVariants = PUSHBACK_VARIANTS.filter((_, index) => 
    !state.pushBackHistory.includes(index.toString())
  );

  if (availableVariants.length === 0) {
    // Reset history if all used
    state.pushBackHistory = [];
    return { response: PUSHBACK_VARIANTS[0], variantId: '0' };
  }

  const randomIndex = Math.floor(Math.random() * availableVariants.length);
  const selectedVariant = availableVariants[randomIndex];
  const variantId = PUSHBACK_VARIANTS.indexOf(selectedVariant).toString();

  return { response: selectedVariant, variantId };
}

/**
 * Update conversation state with new user message
 */
export function updateConversationState(
  state: ConversationState, 
  userMessage: string
): ConversationState {
  const newState = { ...state };
  
  // Add message to recent history (keep sliding window)
  newState.recentMessages = [...state.recentMessages, userMessage].slice(-CLOSING_WINDOW_SIZE);
  newState.currentTurn += 1;

  // Check for closing trigger
  // Closing detection now handled externally to keep this function pure for testability

  return newState;
}

/**
 * Apply (commit) a detected closing trigger to state and emit telemetry.
 */
export function applyClosingTrigger(state: ConversationState, reason: string): ConversationState {
  if (state.closingTriggered) return state; // idempotent
  emit({ type: 'closing_triggered', reason });
  return { ...state, closingTriggered: true };
}

/**
 * Record push-back usage
 */
export function recordPushBackUsage(
  state: ConversationState, 
  variantId: string
): ConversationState {
  emit({ type: 'pushback_used', variantId });
  
  return {
    ...state,
    pushBackHistory: [...state.pushBackHistory, variantId].slice(-5), // Keep last 5
    lastPushBackTurn: state.currentTurn
  };
}

/**
 * Initialize conversation state
 */
export function createConversationState(strategy?: 'A' | 'B' | 'C' | 'D' | 'E'): ConversationState {
  if (strategy) {
    emit({ type: 'strategy_selected', strategy });
  }

  return {
    recentMessages: [],
    pushBackHistory: [],
    lastPushBackTurn: -PUSHBACK_COOLDOWN,
    currentTurn: 0,
    closingTriggered: false,
    strategy
  };
}

/**
 * Generate recap content if requested
 */
export function generateRecapContent(leads: any[]): string {
  emit({ type: 'recap_requested' });
  
  const recap = leads.map((lead, index) => {
    const status = lead.side && lead.product && lead.price ? 'Complete' : 'Incomplete';
    const summary = `Lead ${index + 1}: ${lead.side || 'Unknown'} ${lead.product || 'Product'} - ${status}`;
    return summary;
  }).join('\n');

  emit({ type: 'recap_provided' });
  return recap;
}