import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ConversationState,
  createConversationState,
  updateConversationState,
  shouldTriggerClosing,
  getPushBackResponse,
  recordPushBackUsage,
  generateRecapContent
} from '@/lib/conversationState';

describe('Conversation State Management', () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createConversationState('A');
  });

  describe('Closing trigger detection', () => {
    it('should not trigger closing initially', () => {
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should trigger closing after 3 consecutive negative messages', () => {
      // Add negative messages
      state = updateConversationState(state, "no I don't want this");
      state = updateConversationState(state, "stop asking me questions");
      state = updateConversationState(state, "I'm done with this");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('consecutive_negative_sentiment');
    });

    it('should trigger closing on explicit completion signal', () => {
      state = updateConversationState(state, "okay we're done here goodbye");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('user_completion_signal');
    });

    it('should not trigger if only 2 negative messages', () => {
      state = updateConversationState(state, "no thanks");
      state = updateConversationState(state, "not interested");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should not trigger if negative pattern is broken', () => {
      state = updateConversationState(state, "no thanks");
      state = updateConversationState(state, "actually, let me think about this");
      state = updateConversationState(state, "not interested");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });
  });

  describe('Push-back system', () => {
    it('should not provide push-back initially', () => {
      const { response } = getPushBackResponse(state);
      expect(response).toBeUndefined();
    });

    it('should provide push-back for disengaged user after cooldown', () => {
      // Simulate past cooldown period
      state.currentTurn = 15;
      state.lastPushBackTurn = 1;
      state = updateConversationState(state, "I don't know, maybe");
      
      const { response, variantId } = getPushBackResponse(state);
      expect(response).toBeDefined();
      expect(variantId).toBeDefined();
    });

    it('should respect cooldown period', () => {
      state.currentTurn = 5;
      state.lastPushBackTurn = 1;
      state = updateConversationState(state, "I don't know");
      
      const { response } = getPushBackResponse(state);
      expect(response).toBeUndefined();
    });

    it('should track usage history', () => {
      const variantId = '3';
      const updatedState = recordPushBackUsage(state, variantId);
      
      expect(updatedState.pushBackHistory).toContain(variantId);
      expect(updatedState.lastPushBackTurn).toBe(state.currentTurn);
    });
  });

  describe('Turn management', () => {
    it('should increment turn counter', () => {
      expect(state.currentTurn).toBe(0);
      
      const newState = updateConversationState(state, "hello");
      expect(newState.currentTurn).toBe(1);
    });

    it('should maintain sliding window of recent messages', () => {
      state = updateConversationState(state, "message 1");
      state = updateConversationState(state, "message 2");
      state = updateConversationState(state, "message 3");
      state = updateConversationState(state, "message 4");
      
      expect(state.recentMessages).toHaveLength(3);
      expect(state.recentMessages).toEqual(['message 2', 'message 3', 'message 4']);
    });
  });

  describe('Recap generation', () => {
    it('should generate recap for multiple leads', () => {
      const leads = [
        { side: 'BUY', product: 'Wheat', price: { amount: 300, currency: 'USD' } },
        { side: 'SELL', product: 'Corn' },
        { side: 'BUY', product: 'Soybeans', price: { amount: 400, currency: 'USD' } }
      ];
      
      const recap = generateRecapContent(leads);
      
      expect(recap).toContain('Lead 1: BUY Wheat - Complete');
      expect(recap).toContain('Lead 2: SELL Corn - Incomplete');
  expect(recap).toContain('Lead 3: BUY Soybeans - Complete');
    });

    it('should handle empty leads array', () => {
      const recap = generateRecapContent([]);
      expect(recap).toBe('');
    });
  });

  describe('Strategy initialization', () => {
    it('should initialize with strategy', () => {
      const strategicState = createConversationState('B');
      expect(strategicState.strategy).toBe('B');
    });

    it('should work without strategy', () => {
      const basicState = createConversationState();
      expect(basicState.strategy).toBeUndefined();
    });
  });
});