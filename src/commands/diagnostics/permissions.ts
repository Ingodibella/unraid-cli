import { Command } from 'commander';
import type { DiagnosticsCommandDependencies } from './shared.js';
import {
  applyDiagnosticsCommandOptions,
  createDiagnosticsClient,
  defaultDiagnosticsCommandDependencies,
  resolveDiagnosticsOptions,
  writeDiagnosticsOutput,
} from './shared.js';

const PERMISSIONS_QUERY = `
  query DiagnosticsPermissions {
    me {
      id
      username
      email
      roles
      permissions
    }
  }
`;

export interface PermissionsResult {
  me: {
    id: string | null;
    username: string | null;
    email: string | null;
    roles: string[];
    permissions: string[];
  };
}

export function createDiagnosticsPermissionsCommand(
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
): Command {
  return applyDiagnosticsCommandOptions(new Command('permissions'))
    .description('Show role and permission scope of the current API key')
    .action(async function handlePermissions() {
      const options = resolveDiagnosticsOptions(this);
      const client = createDiagnosticsClient(options, dependencies);
      const response = await client.execute<{
        me?: {
          id?: string | null;
          username?: string | null;
          email?: string | null;
          roles?: Array<string | null> | null;
          permissions?: Array<string | null> | null;
        } | null;
      }>(PERMISSIONS_QUERY);

      const result: PermissionsResult = {
        me: {
          id: response.me?.id ?? null,
          username: response.me?.username ?? null,
          email: response.me?.email ?? null,
          roles: (response.me?.roles ?? []).filter((entry): entry is string => typeof entry === 'string'),
          permissions: (response.me?.permissions ?? []).filter((entry): entry is string => typeof entry === 'string'),
        },
      };

      writeDiagnosticsOutput(result, options, dependencies);
    });
}
