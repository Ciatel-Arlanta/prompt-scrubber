import type { Command } from 'commander';
import { createDefaultConfig, readConfigFile, writeConfig } from '../../core/config.js';

export function setupConfigCommands(program: Command) {
  program
    .command('init')
    .description('Create a default configuration file')
    .option('--force', 'Overwrite an existing configuration file')
    .action((options: { force?: boolean }) => {
      const { path: configPath, exists } = readConfigFile();

      if (exists && !options.force) {
        console.error(
          `Config file already exists at ${configPath}. Re-run with --force to overwrite it.`,
        );
        process.exit(1);
        return;
      }

      try {
        writeConfig(createDefaultConfig());
      } catch (err: unknown) {
        console.error(`Error writing config file: ${(err as Error).message}`);
        process.exit(1);
        return;
      }

      console.log(`Created config file at ${configPath}`);
    });

  const configCommand = program.command('config').description('Manage the configuration file');

  configCommand
    .command('show')
    .description('Print the active configuration')
    .action(() => {
      const { path: configPath, exists, errors, config } = readConfigFile();

      if (exists) {
        console.error(`Config file: ${configPath}`);
      } else {
        console.error(
          `No config file at ${configPath}. Showing defaults — run 'prompt-scrub init' to create one.`,
        );
      }

      for (const error of errors) {
        console.error(`  error: ${error}`);
      }

      console.log(JSON.stringify(config, null, 2));

      if (errors.length > 0) {
        console.error('Invalid entries are ignored at runtime.');
        process.exit(1);
      }
    });
}
