import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CallButton from '@/components/CallButton';

// Capture passed sessionSettings via mocked connect
const connectMock = jest.fn(() => Promise.resolve());
const sendSessionSettingsMock = jest.fn();

jest.mock('@humeai/voice-react', () => ({
  useVoice: () => ({
    status: { value: 'disconnected' },
    // Cast to any to bypass type signature mismatch in test environment
  // @ts-ignore - test environment loosens signature to inspect opts
  connect: (opts: any) => { connectMock(opts); return Promise.resolve(); },
    messages: [],
    sendSessionSettings: sendSessionSettingsMock,
  })
}));

describe('CallButton voice speed integration', () => {
  beforeEach(() => {
    connectMock.mockClear();
    sendSessionSettingsMock.mockClear();
  });

  it('includes voice speed in sessionSettings when provided', async () => {
    const { getByText } = render(
      <CallButton
        accessToken="token"
        persona="professional"
        voiceId="voice123"
        voiceSpeed={1.4}
        modelId="hume-evi-3"
        onToolCall={async () => {}}
      />
    );
    fireEvent.click(getByText('Call TAMI'));
    // Allow microtask queue to flush
    await Promise.resolve();
  expect(connectMock).toHaveBeenCalled();
  // After connect, CallButton invokes sendSessionSettings with the same sessionSettings
  const match = sendSessionSettingsMock.mock.calls.find(c => c[0]?.voice?.speed === 1.4);
  expect(match?.[0]?.voice).toMatchObject({ id: 'voice123', speed: 1.4 });
  });
});
