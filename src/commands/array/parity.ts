import { Command } from 'commander';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  fetchArray,
  fetchParityHistory,
  formatDuration,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ParityStatusRecord {
  status: string | null;
  progress: number | null;
  speed: number | null;
  errors: number | null;
}

export interface ParityHistoryRecord {
  date: string | null;
  duration: string;
  errors: number | null;
  speed: number | null;
  status: string | null;
}

export function mapParityStatus(snapshot: Awaited<ReturnType<typeof fetchArray>>): ParityStatusRecord {
  return {
    status: snapshot.array.parity?.status ?? null,
    progress: snapshot.array.parity?.progress ?? null,
    speed: snapshot.array.parity?.speed ?? null,
    errors: snapshot.array.parity?.errors ?? null,
  };
}

export function mapParityHistory(
  snapshot: Awaited<ReturnType<typeof fetchParityHistory>>,
): ParityHistoryRecord[] {
  return snapshot.parityHistory.map((entry) => ({
    date: entry.date,
    duration: formatDuration(entry.duration),
    errors: entry.errors,
    speed: entry.speed,
    status: entry.status,
  }));
}

export function createParityCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  const parity = new Command('parity').description('Parity check information');

  parity.addCommand(
    applyArrayCommandOptions(new Command('status'))
      .description('Show parity check status (running/idle, progress, speed, errors)')
      .action(async function handleParityStatus() {
        const options = resolveArrayOptions(this);
        const snapshot = await fetchArray(options, dependencies);
        writeRenderedOutput(mapParityStatus(snapshot), options, dependencies);
      }),
  );

  parity.addCommand(
    applyArrayCommandOptions(new Command('history'))
      .description('Show past parity check results (date, duration, errors, speed)')
      .action(async function handleParityHistory() {
        const options = resolveArrayOptions(this);
        const snapshot = await fetchParityHistory(options, dependencies);
        writeRenderedOutput(mapParityHistory(snapshot), options, dependencies);
      }),
  );

  return parity;
}
