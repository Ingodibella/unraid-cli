import { Command } from 'commander';
import type { SystemCommandDependencies } from './shared.js';
import {
  applySystemCommandOptions,
  defaultSystemCommandDependencies,
  fetchSystemSnapshot,
  resolveSystemOptions,
  writeRenderedOutput,
} from './shared.js';

export interface SystemUptimeRecord {
  available: false;
  message: string;
  serverTime: string;
}

export function mapSystemUptime(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemUptimeRecord {
  return {
    available: false,
    message: 'Uptime is not available from the current API schema.',
    serverTime: snapshot.info.time,
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
