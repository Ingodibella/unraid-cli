import { Command } from 'commander';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  fetchArray,
  formatBytes,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ArrayShowRecord {
  state: string | null;
  capacity: string;
  used: string;
  free: string;
  diskCount: number | null;
}

export function mapArrayShow(snapshot: Awaited<ReturnType<typeof fetchArray>>): ArrayShowRecord {
  return {
    state: snapshot.array.state,
    capacity: formatBytes(snapshot.array.capacity),
    used: formatBytes(snapshot.array.used),
    free: formatBytes(snapshot.array.free),
    diskCount: snapshot.array.diskCount,
  };
}

export function createArrayShowCommand(
  dependencies: ArrayCommandDependencies = defaultArrayCommandDependencies,
): Command {
  return applyArrayCommandOptions(new Command('show'))
    .description('Show full array overview (state, capacity, usage, disk count)')
    .action(async function handleArrayShow() {
      const options = resolveArrayOptions(this);
      const snapshot = await fetchArray(options, dependencies);
      writeRenderedOutput(mapArrayShow(snapshot), options, dependencies);
    });
}
