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
  id: number | null;
  name: string | null;
  value: number | null;
  worst: number | null;
  threshold: number | null;
  raw: string | null;
  status: string | null;
}

export function createDisksSmartCommand(
  dependencies: DisksCommandDependencies = defaultDisksCommandDependencies,
): Command {
  return applyDisksCommandOptions(new Command('smart'))
    .argument('<name>', 'Disk name')
    .description('Show SMART attributes for a disk')
    .action(async function handleDisksSmart(name: string) {
      const options = resolveDisksOptions(this);
      const disk = await fetchDisk(name, options, dependencies);
      const rows = disk.smartAttributes.map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        value: attribute.value,
        worst: attribute.worst,
        threshold: attribute.threshold,
        raw: attribute.raw,
        status: attribute.status,
      } satisfies DiskSmartRecord));

      writeRenderedOutput(rows, options, dependencies);
    });
}
