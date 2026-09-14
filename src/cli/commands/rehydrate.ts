import type { Command } from 'commander';
import { resolveEncryptionKeyOrExit, runCliAction } from '../../core/cli-key-resolver.js';
import { isSessionEncrypted } from '../../session/storage.js';
import { rehydrate } from '../../core/rehydrate.js';
import { readInput } from '../io.js';
import { emitJson } from '../output.js';

export function handleRehydrate(text: string, options: { sessionId: string }) {
  const result = rehydrate({
    content: text,
    sessionId: options.sessionId,
  });
  return result;
}

export function setupRehydrateCommand(program: Command) {
  program
    .command('rehydrate')
    .description('Rehydrate a file using stored session')
    .argument('[file]', 'File to rehydrate. If omitted, reads from stdin.')
    .requiredOption('--session-id <id>', 'Resume or target a specific session')
    .option('--json', 'Output a structured JSON object instead of plain text')
    .action(async (file, options) => {
      await runCliAction(async () => {
        const input = readInput(file, options.json);
        if (input === undefined) return;
        if (!input) {
          if (options.json) {
            const output = {
              content: '',
              sessionId: options.sessionId,
              warnings: [],
            };
            emitJson(output);
          }
          process.exit(0);
          return;
        }

        if (isSessionEncrypted(options.sessionId)) {
          await resolveEncryptionKeyOrExit();
        }

        const result = handleRehydrate(input, options);

        if (options.json) {
          const output = {
            content: result.content,
            sessionId: options.sessionId,
            warnings: result.warnings ?? [],
          };
          emitJson(output);
          return;
        }

        // Print rehydrated content to stdout
        const outStr =
          typeof result.content === 'string'
            ? result.content
            : JSON.stringify(result.content, null, 2);
        process.stdout.write(outStr);

        // Print any warnings to stderr
        if (result.warnings && result.warnings.length > 0) {
          for (const warning of result.warnings) {
            console.error(warning);
          }
        }
      });
    });
}
