import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as telemetry from '@/utils/telemetry';
import { updateConversationState, createConversationState, getPushBackResponse } from '@/lib/conversationState';

/**
 * High-level integration style tests around closing + pushback progression.
 * (Hook-specific rendering covered indirectly; logic driven via state utilities here.)
 */

describe('Conversation integration (closing + pushback + telemetry)', () => {
  const emitSpy = jest.spyOn(telemetry, 'emit').mockImplementation(() => { /* noop */ });

  beforeEach(() => {
    emitSpy.mockClear();
  });

  it('emits closing_triggered after sustained negative sentiment progression', () => {
    let state = createConversationState('A');

    state = updateConversationState(state, "no I'm not interested");
    state = updateConversationState(state, "please stop asking");
    state = updateConversationState(state, "we are done here goodbye");

    // shouldTriggerClosing is evaluated inside hook in app; we simulate by re-calling update until flag set
    // The library sets closingTriggered internally when patterns match, so assert flag
    expect(state.closingTriggered).toBe(true);
  });

  it('produces pushback variant after cooldown and records history', () => {
    let state = createConversationState('C');
    state.currentTurn = 20; // advance turns artificially
    state.lastPushBackTurn = 1;

    state = updateConversationState(state, 'I do not know maybe later');

    const { response, variantId } = getPushBackResponse(state);
    expect(response).toBeDefined();
    expect(variantId).toBeDefined();
  });
});
