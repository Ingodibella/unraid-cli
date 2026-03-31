import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { getDefaultConfigPath, resolveConfig } from '../../core/config/loader.js';
import { resolveAuth } from '../../core/auth/resolver.js';
import { fetchSchemaIntrospection } from '../../core/graphql/introspection.js';
import type { DiagnosticsCommandDependencies } from './shared.js';
import {
  applyDiagnosticsCommandOptions,
  createDiagnosticsClient,
  defaultDiagnosticsCommandDependencies,
  resolveDiagnosticsOptions,
  writeDiagnosticsOutput,
} from './shared.js';

const CONNECTIVITY_QUERY = `
  query DiagnosticsDoctorConnectivity {
    info {
      osPlatform
    }
  }
`;

const PERMISSIONS_QUERY = `
  query DiagnosticsDoctorPermissions {
    me {
      roles
    }
  }
`;

export interface DoctorCheck {
  name: 'config' | 'auth' | 'connectivity' | 'schema' | 'permissions';
  ok: boolean;
  message: string;
}

export interface DoctorResult {
  ok: boolean;
  checks: DoctorCheck[];
}

export function createDiagnosticsDoctorCommand(
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
): Command {
  return applyDiagnosticsCommandOptions(new Command('doctor'))
    .description('Run a full diagnostics checklist for config, auth, connectivity, schema, and permissions')
    .action(async function handleDoctor() {
      const options = resolveDiagnosticsOptions(this);
      const checks: DoctorCheck[] = [];
      const configPath = process.env.UCLI_CONFIG ?? getDefaultConfigPath();
      const resolvedConfig = resolveConfig(options);

      checks.push({
        name: 'config',
        ok: existsSync(configPath) || Boolean(resolvedConfig.host),
        message: existsSync(configPath)
          ? `Config file found at ${configPath}`
          : 'Config file not found, using flags or environment values',
      });

      let client: ReturnType<typeof createDiagnosticsClient> | null = null;

      try {
        resolveAuth({
          host: options.host ?? resolvedConfig.host,
          apiKey: options.apiKey ?? resolvedConfig.apiKey,
          profile: options.profile ?? resolvedConfig.profile,
        });
        checks.push({ name: 'auth', ok: true, message: 'Credentials resolved successfully' });
        client = createDiagnosticsClient(options, dependencies);
      } catch (error) {
        checks.push({
          name: 'auth',
          ok: false,
          message: error instanceof Error ? error.message : 'Failed to resolve credentials',
        });
      }

      if (client) {
        try {
          await client.execute(CONNECTIVITY_QUERY);
          checks.push({ name: 'connectivity', ok: true, message: 'GraphQL endpoint reachable' });
        } catch (error) {
          checks.push({
            name: 'connectivity',
            ok: false,
            message: error instanceof Error ? error.message : 'Endpoint is not reachable',
          });
        }

        try {
          await fetchSchemaIntrospection(client);
          checks.push({ name: 'schema', ok: true, message: 'Schema introspection succeeded' });
        } catch (error) {
          checks.push({
            name: 'schema',
            ok: false,
            message: error instanceof Error ? error.message : 'Schema introspection failed',
          });
        }

        try {
          await client.execute(PERMISSIONS_QUERY);
          checks.push({ name: 'permissions', ok: true, message: 'Permission query succeeded' });
        } catch (error) {
          checks.push({
            name: 'permissions',
            ok: false,
            message: error instanceof Error ? error.message : 'Permission query failed',
          });
        }
      } else {
        checks.push({ name: 'connectivity', ok: false, message: 'Skipped because auth failed' });
        checks.push({ name: 'schema', ok: false, message: 'Skipped because auth failed' });
        checks.push({ name: 'permissions', ok: false, message: 'Skipped because auth failed' });
      }

      writeDiagnosticsOutput({ ok: checks.every((check) => check.ok), checks } satisfies DoctorResult, options, dependencies);
    });
}
