import { emit } from '@/utils/telemetry';

export type Strategy = 'A' | 'B' | 'C' | 'D' | 'E';

function randomStrategy(): Strategy {
  const opts: Strategy[] = ['A','B','C','D','E'];
  return opts[Math.floor(Math.random()*opts.length)];
}

export function resolveStrategy(): Strategy | undefined {
  const raw = process.env.NEXT_PUBLIC_STRATEGY;
  if (!raw) return undefined;
  if (raw === 'RANDOM') {
    const s = randomStrategy();
    emit({ type: 'strategy_selected', strategy: s });
    return s;
  }
  if (['A','B','C','D','E'].includes(raw)) {
    const s = raw as Strategy;
    emit({ type: 'strategy_selected', strategy: s });
    return s;
  }
  return undefined;
}
