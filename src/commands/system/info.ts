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

export interface SystemInfoRecord {
  osPlatform: string | null;
  distro: string | null;
  release: string | null;
  hostname: string | null;
  uptime: number | null;
  uptimeHuman: string;
}

export function mapSystemInfo(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemInfoRecord {
  return {
    osPlatform: snapshot.info.osPlatform,
    distro: snapshot.info.distro,
    release: snapshot.info.release,
    hostname: snapshot.info.hostname,
    uptime: snapshot.info.uptime,
    uptimeHuman: formatUptime(snapshot.info.uptime),
  };
}

export function createSystemInfoCommand(
  dependencies: SystemCommandDependencies = defaultSystemCommandDependencies,
): Command {
  return applySystemCommandOptions(new Command('info'))
    .description('Show OS and host information')
    .action(async function handleInfo() {
      const options = resolveSystemOptions(this);
      const snapshot = await fetchSystemSnapshot(options, dependencies);
      writeRenderedOutput(mapSystemInfo(snapshot), options, dependencies);
    });
}
