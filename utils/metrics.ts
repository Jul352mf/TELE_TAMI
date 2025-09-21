// Simple in-memory metrics counters (reset on reload). For production replace with persistent analytics.

interface Counters {
  confirmations: number;
  leadsCompleted: number;
  leadsStarted: number;
}

const counters: Counters = {
  confirmations: 0,
  leadsCompleted: 0,
  leadsStarted: 0
};

export function inc(name: keyof Counters, by: number = 1) {
  counters[name] += by;
}

export function snapshot() {
  return { ...counters };
}
