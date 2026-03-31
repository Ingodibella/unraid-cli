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
  hostname: string | null;
  platform: string | null;
  distro: string | null;
  release: string | null;
  kernel: string | null;
  arch: string | null;
  time: string;
  cpu: string | null;
  cpuCores: number | null;
  cpuSpeed: number | null;
  unraidVersion: string | null;
  apiVersion: string | null;
  serverName: string | null;
  serverStatus: string | null;
}

export function mapSystemInfo(snapshot: Awaited<ReturnType<typeof fetchSystemSnapshot>>): SystemInfoRecord {
  const { info, server } = snapshot;
  const cpuBrand = [info.cpu.manufacturer, info.cpu.brand].filter(Boolean).join(' ') || null;
  return {
    hostname: info.os.hostname,
    platform: info.os.platform,
    distro: info.os.distro,
    release: info.os.release,
    kernel: info.os.kernel,
    arch: info.os.arch,
    time: info.time,
    cpu: cpuBrand,
    cpuCores: info.cpu.cores,
    cpuSpeed: info.cpu.speed,
    unraidVersion: info.versions.core.unraid,
    apiVersion: info.versions.core.api,
    serverName: server?.name ?? null,
    serverStatus: server?.status ?? null,
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
