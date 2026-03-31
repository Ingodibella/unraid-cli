import { Command } from 'commander';
import { applyFilters, applySort } from '../../core/filters/index.js';
import type { ServicesCommandDependencies } from './shared.js';
import {
  applyServicesListOptions,
  defaultServicesCommandDependencies,
  fetchServices,
  paginateItems,
  resolveServicesOptions,
  writeRenderedOutput,
} from './shared.js';

export function createServicesListCommand(
  dependencies: ServicesCommandDependencies = defaultServicesCommandDependencies,
): Command {
  return applyServicesListOptions(new Command('list'))
    .description('List all services with current status')
    .action(async function handleServicesList() {
      const options = resolveServicesOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchServices(options, dependencies);

      let rows = snapshot.services.map((service) => ({
        name: service.name,
        status: service.status,
        enabled: service.enabled,
      }));

      if (localOptions.filter) {
        rows = applyFilters(rows, localOptions.filter);
      }

      if (localOptions.sort) {
        rows = applySort(rows, localOptions.sort);
      }

      writeRenderedOutput(paginateItems(rows, options), options, dependencies);
    });
}
