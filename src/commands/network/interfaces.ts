import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { NetworkCommandDependencies } from './shared.js';
import {
  applyNetworkCommandOptions,
  applyNetworkListOptions,
  defaultNetworkCommandDependencies,
  fetchInterfaceByName,
  fetchNetwork,
  paginateItems,
  resolveNetworkOptions,
  writeRenderedOutput,
} from './shared.js';

export function createNetworkInterfacesCommand(
  dependencies: NetworkCommandDependencies = defaultNetworkCommandDependencies,
): Command {
  const interfaces = new Command('interfaces')
    .description('Inspect network interfaces');

  interfaces.addCommand(
    applyNetworkListOptions(new Command('list'))
      .description('List all network interfaces')
      .action(async function handleInterfaceList() {
        const options = resolveNetworkOptions(this);
        const localOptions = this.opts<{ filter?: string; sort?: string }>();
        const snapshot = await fetchNetwork(options, dependencies);

        let rows = snapshot.network.interfaces;

        if (localOptions.filter) {
          rows = applyFilters(rows, localOptions.filter);
        }

        if (localOptions.sort) {
          rows = applySort(rows, localOptions.sort);
        }

        writeRenderedOutput(paginateItems(rows, options), options, dependencies);
      }),
  );

  interfaces.addCommand(
    applyNetworkCommandOptions(new Command('get'))
      .argument('<name>', 'Interface name')
      .description('Show details for one network interface')
      .action(async function handleInterfaceGet(name: string) {
        const options = resolveNetworkOptions(this);
        const iface = await fetchInterfaceByName(name, options, dependencies);
        writeRenderedOutput(iface, options, dependencies);
      }),
  );

  return interfaces;
}
