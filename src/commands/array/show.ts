import { Command } from 'commander';
import type { ArrayCommandDependencies } from './shared.js';
import {
  applyArrayCommandOptions,
  defaultArrayCommandDependencies,
  fetchArray,
  formatKilobytes,
  formatState,
  resolveArrayOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ArrayShowRecord {
  state: string | null;
  capacity: string;
  used: string;
  free: string;
  diskCount: number;
}

export function mapArrayShow(snapshot: Awaited<ReturnType<typeof fetchArray>>): ArrayShowRecord {
  return {
    state: formatState(snapshot.array.state),
    capacity: formatKilobytes(snapshot.array.capacity?.kilobytes?.total),
    used: formatKilobytes(snapshot.array.capacity?.kilobytes?.used),
    free: formatKilobytes(snapshot.array.capacity?.kilobytes?.free),
    diskCount: snapshot.array.disks.length,
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
