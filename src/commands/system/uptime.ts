import { Command } from 'commander';
import type { SystemCommandDependencies } from './shared.js';
import {
  applySystemCommandOptions,
  defaultSystemCommandDependencies,
  fetchSystemSnapshot,
  formatUptime,
  resolveSystemOptions,
  writeRenderedOutput,
} from './shared.js';

export interface SystemUptimeRecord {
  seconds: number | null;
  human: string;
}

export function mapSystemUptime(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemUptimeRecord {
  return {
    seconds: snapshot.info.uptime,
    human: formatUptime(snapshot.info.uptime),
  };
}

export function createSystemUptimeCommand(
  dependencies: SystemCommandDependencies = defaultSystemCommandDependencies,
): Command {
  return applySystemCommandOptions(new Command('uptime'))
    .description('Show server uptime in human readable form')
    .action(async function handleUptime() {
      const options = resolveSystemOptions(this);
      const snapshot = await fetchSystemSnapshot(options, dependencies);
      writeRenderedOutput(mapSystemUptime(snapshot), options, dependencies);
    });
}
