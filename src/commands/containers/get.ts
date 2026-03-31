import { Command } from 'commander';
import type { ContainersCommandDependencies } from './shared.js';
import {
  applyContainersCommandOptions,
  defaultContainersCommandDependencies,
  fetchContainer,
  formatBytes,
  formatPorts,
  normalizeContainerName,
  resolveContainersOptions,
  writeRenderedOutput,
} from './shared.js';

export interface ContainerDetailRecord {
  id: string | null;
  name: string | null;
  image: string | null;
  status: string | null;
  state: string | null;
  command: string | null;
  createdAt: string | null;
  startedAt: string | null;
  uptime: string | null;
  ports: string;
  cpuPercent: number | null;
  memoryUsage: string;
  memoryLimit: string;
  memoryPercent: number | null;
  pids: number | null;
}

export function createContainersGetCommand(
  dependencies: ContainersCommandDependencies = defaultContainersCommandDependencies,
): Command {
  return applyContainersCommandOptions(new Command('get'))
    .argument('<name>', 'Container name')
    .description('Show detailed information for a single container')
    .action(async function handleContainersGet(name: string) {
      const options = resolveContainersOptions(this);
      const container = await fetchContainer(name, options, dependencies);

      writeRenderedOutput({
        id: container.id,
        name: normalizeContainerName(container.name),
        image: container.image,
        status: container.status,
        state: container.state,
        command: container.command,
        createdAt: container.createdAt,
        startedAt: container.startedAt,
        uptime: container.uptime,
        ports: formatPorts(container.ports),
        cpuPercent: container.stats?.cpuPercent ?? null,
        memoryUsage: formatBytes(container.stats?.memoryUsage),
        memoryLimit: formatBytes(container.stats?.memoryLimit),
        memoryPercent: container.stats?.memoryPercent ?? null,
        pids: container.stats?.pids ?? null,
      } satisfies ContainerDetailRecord, options, dependencies);
    });
}
