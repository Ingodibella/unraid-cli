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

export function createServicesStatusCommand(
  dependencies: ServicesCommandDependencies = defaultServicesCommandDependencies,
): Command {
  return applyServicesListOptions(new Command('status'))
    .description('Show service online/offline overview')
    .action(async function handleServicesStatus() {
      const options = resolveServicesOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchServices(options, dependencies);

      let services = snapshot.map((service) => ({
        id: service.id,
        name: service.name,
        online: service.online,
      }));

      if (localOptions.filter) services = applyFilters(services, localOptions.filter);
      if (localOptions.sort) services = applySort(services, localOptions.sort);

      const summary = snapshot.reduce((counts, service) => {
        if (service.online === true) counts.online += 1;
        else counts.offline += 1;
        return counts;
      }, { online: 0, offline: 0 });

      writeRenderedOutput({ summary, services: paginateItems(services, options) }, options, dependencies);
    });
}
