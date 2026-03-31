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
    .description('Show service health overview and status list')
    .action(async function handleServicesStatus() {
      const options = resolveServicesOptions(this);
      const localOptions = this.opts<{ filter?: string; sort?: string }>();
      const snapshot = await fetchServices(options, dependencies);

      let services = snapshot.services.map((service) => ({
        name: service.name,
        status: service.status,
        enabled: service.enabled,
      }));

      if (localOptions.filter) {
        services = applyFilters(services, localOptions.filter);
      }

      if (localOptions.sort) {
        services = applySort(services, localOptions.sort);
      }

      const summary = snapshot.services.reduce((counts, service) => {
        const normalized = (service.status ?? 'unknown').toLowerCase();
        if (normalized.includes('run')) {
          counts.running += 1;
        } else if (normalized.includes('stop') || normalized.includes('dead') || normalized.includes('fail')) {
          counts.stopped += 1;
        } else {
          counts.other += 1;
        }
        return counts;
      }, { running: 0, stopped: 0, other: 0 });

      writeRenderedOutput({
        summary,
        services: paginateItems(services, options),
      }, options, dependencies);
    });
}
