type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: Level;
  msg: string;
  context?: Record<string, any>;
}

function base(level: Level, msg: string, context?: Record<string, any>) {
  const entry: LogEntry = { ts: new Date().toISOString(), level, msg, context };
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level]("[tami]", entry);
}

export const logger = {
  debug: (m: string, c?: Record<string, any>) => base('debug', m, c),
  info: (m: string, c?: Record<string, any>) => base('info', m, c),
  warn: (m: string, c?: Record<string, any>) => base('warn', m, c),
  error: (m: string, c?: Record<string, any>) => base('error', m, c),
};
