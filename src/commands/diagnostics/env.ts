import { Command } from 'commander';
import { getDefaultConfigPath, resolveConfig } from '../../core/config/loader.js';
import type { DiagnosticsCommandDependencies } from './shared.js';
import {
  applyDiagnosticsCommandOptions,
  defaultDiagnosticsCommandDependencies,
  maskSecret,
  resolveDiagnosticsOptions,
  writeDiagnosticsOutput,
} from './shared.js';

export interface DiagnosticsEnvResult {
  host: string | null;
  apiKeyMasked: string | null;
  profile: string | null;
  configPath: string;
  env: {
    UCLI_HOST: string | null;
    UCLI_API_KEY: string | null;
    UCLI_PROFILE: string | null;
    UCLI_CONFIG: string | null;
  };
}

export function createDiagnosticsEnvCommand(
  dependencies: DiagnosticsCommandDependencies = defaultDiagnosticsCommandDependencies,
): Command {
  return applyDiagnosticsCommandOptions(new Command('env'))
    .description('Show resolved configuration and related environment variables')
    .action(function handleEnv() {
      const options = resolveDiagnosticsOptions(this);
      const resolved = resolveConfig(options);

      const result: DiagnosticsEnvResult = {
        host: resolved.host ?? null,
        apiKeyMasked: maskSecret(resolved.apiKey),
        profile: resolved.profile ?? null,
        configPath: process.env.UCLI_CONFIG ?? getDefaultConfigPath(),
        env: {
          UCLI_HOST: process.env.UCLI_HOST ?? null,
          UCLI_API_KEY: maskSecret(process.env.UCLI_API_KEY),
          UCLI_PROFILE: process.env.UCLI_PROFILE ?? null,
          UCLI_CONFIG: process.env.UCLI_CONFIG ?? null,
        },
      };

      writeDiagnosticsOutput(result, options, dependencies);
    });
}
