import React from 'react';
import { render } from '@testing-library/react';
import SessionTimers from '@/components/SessionTimers';

// Basic smoke test placeholder; full timing simulation would require mocking voice context
jest.mock('@humeai/voice-react', () => ({
  useVoice: () => ({ status: { value: 'disconnected' }, messages: [], disconnect: jest.fn() })
}));

describe('SessionTimers', () => {
  it('renders without crashing when disconnected', () => {
    render(React.createElement(SessionTimers));
  });
});
