import { Command } from 'commander';
import type { NetworkCommandDependencies } from './shared.js';
import {
  applyNetworkCommandOptions,
  defaultNetworkCommandDependencies,
  fetchNetwork,
  resolveNetworkOptions,
  writeRenderedOutput,
} from './shared.js';

export function createNetworkStatusCommand(
  dependencies: NetworkCommandDependencies = defaultNetworkCommandDependencies,
): Command {
  return applyNetworkCommandOptions(new Command('status'))
    .description('Show network overview status')
    .action(async function handleNetworkStatus() {
      const options = resolveNetworkOptions(this);
      const snapshot = await fetchNetwork(options, dependencies);

      writeRenderedOutput({
        hostname: snapshot.network.hostname,
        gateway: snapshot.network.gateway,
        dns: snapshot.network.dns,
        interfaces: snapshot.network.interfaces.length,
      }, options, dependencies);
    });
}
