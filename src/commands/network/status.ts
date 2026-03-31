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
        id: snapshot.network.id,
        accessUrls: snapshot.network.accessUrls ?? [],
        interfaces: snapshot.info.networkInterfaces.length,
      }, options, dependencies);
    });
}
