import { Command } from 'commander';
import type { DisksCommandDependencies } from './shared.js';
import {
  applyDisksCommandOptions,
  defaultDisksCommandDependencies,
  fetchDisk,
  resolveDisksOptions,
  writeRenderedOutput,
} from './shared.js';

export interface DiskSmartRecord {
  name: string | null;
  smartStatus: string | null;
}

export function createDisksSmartCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('smart'))
    .argument('<name>', 'Disk name')
    .description('Show SMART status for a disk')
    .action(async function handleDisksSmart(name: string) {
      const options = resolveDisksOptions(this);
      const disk = await fetchDisk(name, options, dependencies);

      writeRenderedOutput({
        name: disk.name,
        smartStatus: disk.smartStatus,
      } satisfies DiskSmartRecord, options, dependencies);
    });
}
