import { describe, it, expect } from '@jest/globals';
import { createConversationState, updateConversationState, shouldTriggerClosing } from '@/lib/conversationState';

/**
 * Integration-style closing trigger path: simulate sequential negative / completion messages.
 */

describe('Closing integration flow', () => {
  it('triggers closing through completion signal', () => {
    let state = createConversationState('D');
    state = updateConversationState(state, 'okay this is great thank you we are done');
    const { trigger, reason } = shouldTriggerClosing(state);
    expect(trigger).toBe(true);
    expect(reason).toBe('user_completion_signal');
  });

  it('triggers closing through repeated negative sentiment', () => {
    let state = createConversationState('E');
    state = updateConversationState(state, 'no I do not want');
    state = updateConversationState(state, 'stop asking please');
    state = updateConversationState(state, 'leave this now goodbye');
    const { trigger, reason } = shouldTriggerClosing(state);
    expect(trigger).toBe(true);
    expect(reason).toBe('consecutive_negative_sentiment');
  });
});
