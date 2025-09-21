import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ConversationState,
  createConversationState,
  updateConversationState,
  shouldTriggerClosing,
} from '@/lib/conversationState';

describe('Closing Sentiment Test Suite', () => {
  let state: ConversationState;

  beforeEach(() => {
    state = createConversationState('A');
  });

  describe('Negative sentiment patterns', () => {
    it('should detect "no" patterns', () => {
      state = updateConversationState(state, "no I don't want this");
      state = updateConversationState(state, "nope, not interested");
      state = updateConversationState(state, "no way");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('consecutive_negative_sentiment');
    });

    it('should detect frustration patterns', () => {
      state = updateConversationState(state, "I'm getting frustrated with this");
      state = updateConversationState(state, "this is annoying");
      state = updateConversationState(state, "I'm tired of these questions");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('consecutive_negative_sentiment');
    });

    it('should detect refusal patterns', () => {
      state = updateConversationState(state, "I can't provide that information");
      state = updateConversationState(state, "I won't answer these questions");
      state = updateConversationState(state, "I don't want to continue");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('consecutive_negative_sentiment');
    });

    it('should detect dismissive patterns', () => {
      state = updateConversationState(state, "whatever, I don't care");
      state = updateConversationState(state, "fine, just skip it");
      state = updateConversationState(state, "forget it, this is pointless");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('consecutive_negative_sentiment');
    });
  });

  describe('Explicit completion signals', () => {
    it('should detect "done" variants', () => {
      state = updateConversationState(state, "okay I think we're done here");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('user_completion_signal');
    });

    it('should detect "finished" variants', () => {
      state = updateConversationState(state, "I'm finished with this conversation");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('user_completion_signal');
    });

    it('should detect "complete" variants', () => {
      state = updateConversationState(state, "that's complete, thanks");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('user_completion_signal');
    });

    it('should detect farewell patterns', () => {
      state = updateConversationState(state, "goodbye, have a nice day");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('user_completion_signal');
    });

    it('should detect "that\'s all" patterns', () => {
      state = updateConversationState(state, "that's all I have for now");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('user_completion_signal');
    });
  });

  describe('Edge cases and boundaries', () => {
    it('should not trigger on single negative message', () => {
      state = updateConversationState(state, "no, that's not correct");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should not trigger on two negative messages', () => {
      state = updateConversationState(state, "no, that's wrong");
      state = updateConversationState(state, "nope, still not right");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should reset negative sequence with positive message', () => {
      state = updateConversationState(state, "no, that's wrong");
      state = updateConversationState(state, "nope, still not right");
      state = updateConversationState(state, "actually, let me clarify that");
      state = updateConversationState(state, "no wait, I don't think so");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should handle mixed sentiment correctly', () => {
      state = updateConversationState(state, "I don't think that's right");
      state = updateConversationState(state, "but let me check again");
      state = updateConversationState(state, "no, I was wrong before");
      state = updateConversationState(state, "not interested in this approach");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should not trigger on questions containing negative words', () => {
      state = updateConversationState(state, "What if I don't have that information?");
      state = updateConversationState(state, "Can you help when I'm not sure?");
      state = updateConversationState(state, "How do I proceed if I can't find it?");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should not trigger on completion signals in questions', () => {
      state = updateConversationState(state, "How do I know when we're done?");
      
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });
  });

  describe('Case sensitivity and variations', () => {
    it('should detect uppercase negative patterns', () => {
      state = updateConversationState(state, "NO I DON'T WANT THIS");
      state = updateConversationState(state, "STOP ASKING ME");
      state = updateConversationState(state, "NOT INTERESTED");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('consecutive_negative_sentiment');
    });

    it('should detect mixed case completion signals', () => {
      state = updateConversationState(state, "GOODBYE for now");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('user_completion_signal');
    });

    it('should handle contractions correctly', () => {
      state = updateConversationState(state, "I can't do this");
      state = updateConversationState(state, "won't answer that");
      state = updateConversationState(state, "don't want to continue");
      
      const { trigger, reason } = shouldTriggerClosing(state);
      expect(trigger).toBe(true);
      expect(reason).toBe('consecutive_negative_sentiment');
    });
  });

  describe('Context sensitivity', () => {
    it('should handle negative responses about specific fields differently than overall sentiment', () => {
      state = updateConversationState(state, "I don't have the price information");
      state = updateConversationState(state, "Can't provide the exact quantity");
      state = updateConversationState(state, "Not sure about the delivery terms");
      
      // These should not trigger closing as they're informational, not dismissive
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });

    it('should differentiate between clarification and rejection', () => {
      state = updateConversationState(state, "No, that's not the right product");
      state = updateConversationState(state, "Not that price, a different one");
      state = updateConversationState(state, "No, let me correct that");
      
      // These are clarifications, not rejections
      const { trigger } = shouldTriggerClosing(state);
      expect(trigger).toBe(false);
    });
  });

  describe('Integration with conversation flow', () => {
    it('should maintain conversation history correctly', () => {
      expect(state.recentMessages).toHaveLength(0);
      
      state = updateConversationState(state, "Hello");
      expect(state.recentMessages).toHaveLength(1);
      
      state = updateConversationState(state, "This is message 2");
      state = updateConversationState(state, "This is message 3");
      state = updateConversationState(state, "This is message 4");
      
      // Should only keep last 3 messages
      expect(state.recentMessages).toHaveLength(3);
      expect(state.recentMessages).not.toContain("Hello");
    });

    it('should increment turn counter correctly', () => {
      expect(state.currentTurn).toBe(0);
      
      state = updateConversationState(state, "First message");
      expect(state.currentTurn).toBe(1);
      
      state = updateConversationState(state, "Second message");
      expect(state.currentTurn).toBe(2);
    });

    it('should not re-trigger closing once triggered', () => {
      // Trigger closing first time
      state = updateConversationState(state, "no thanks");
      state = updateConversationState(state, "not interested");
      state = updateConversationState(state, "stop calling");
      
      let result = shouldTriggerClosing(state);
      expect(result.trigger).toBe(true);
      
      // Mark as triggered
      state.closingTriggered = true;
      
      // Add more negative messages
      state = updateConversationState(state, "still no");
      state = updateConversationState(state, "definitely not");
      state = updateConversationState(state, "absolutely not");
      
      result = shouldTriggerClosing(state);
      expect(result.trigger).toBe(false); // Should not re-trigger
    });
  });
});