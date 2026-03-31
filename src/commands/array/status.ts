import { Command } from 'commander';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  fetchArray,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ArrayStatusRecord {
  state: string | null;
  parityStatus: string | null;
  parityProgress: number | null;
  parityErrors: number | null;
}

export function mapArrayStatus(snapshot: Awaited<ReturnType<typeof fetchArray>>): ArrayStatusRecord {
  return {
    state: snapshot.array.state,
    parityStatus: snapshot.array.parity?.status ?? null,
    parityProgress: snapshot.array.parity?.progress ?? null,
    parityErrors: snapshot.array.parity?.errors ?? null,
  };
}

export function createArrayStatusCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  return applyArrayCommandOptions(new Command('status'))
    .description('Show array state (Started/Stopped) with parity indicator')
    .action(async function handleArrayStatus() {
      const options = resolveArrayOptions(this);
      const snapshot = await fetchArray(options, dependencies);
      writeRenderedOutput(mapArrayStatus(snapshot), options, dependencies);
    });
}
