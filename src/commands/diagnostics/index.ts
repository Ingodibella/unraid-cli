import { Command } from 'commander';
import { createDiagnosticsDoctorCommand } from './doctor.js';
import { createDiagnosticsPingCommand } from './ping.js';
import { createDiagnosticsLatencyCommand } from './latency.js';
import { createDiagnosticsPermissionsCommand } from './permissions.js';
import { createDiagnosticsEnvCommand } from './env.js';
import { createDiagnosticsGraphqlCommand } from './graphql.js';

export function createDiagnosticsCommand(): Command {
  const command = new Command('diagnostics')
    .description('Run diagnostics for connectivity, auth, and GraphQL troubleshooting');

  command.addCommand(createDiagnosticsDoctorCommand());
  command.addCommand(createDiagnosticsPingCommand());
  command.addCommand(createDiagnosticsLatencyCommand());
  command.addCommand(createDiagnosticsPermissionsCommand());
  command.addCommand(createDiagnosticsEnvCommand());
  command.addCommand(createDiagnosticsGraphqlCommand());

  return command;
}
