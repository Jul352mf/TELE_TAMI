export type TriOption<T extends string = string> =
  | { mode: 'DEFAULT' }
  | { mode: 'NONE' }
  | { mode: 'CUSTOM'; value: T };

export interface UiSettingsState {
  configId: TriOption<string>;
  codeSystemPrompt: TriOption<string>;
  customConfigInput?: string; // transient user input before applying
}

export const initialUiSettings: UiSettingsState = {
  configId: { mode: 'DEFAULT' },
  codeSystemPrompt: { mode: 'DEFAULT' },
};

export function resolveConfigId(option: TriOption<string>): string | undefined {
  if (option.mode === 'NONE') return undefined;
  if (option.mode === 'DEFAULT') {
    return (
      process.env.NEXT_PUBLIC_HUME_DEFAULT_CONFIG_ID ||
      process.env.NEXT_PUBLIC_HUME_CONFIG_ID ||
      undefined
    );
  }
  return option.value;
}

export function shouldSendSystemPrompt(opt: TriOption<string>): boolean {
  return opt.mode !== 'NONE';
}
