import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { Command } from 'commander';
import { handleScrub } from './scrub.js';

export function readClipboard(): string {
  try {
    if (process.platform === 'win32') {
      return execSync('powershell.exe -NoProfile -Command Get-Clipboard', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).replace(/\r\n$/, '');
    }
    if (process.platform === 'darwin') {
      return execSync('pbpaste', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    }
    return execSync('xclip -selection clipboard -o', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

export function writeClipboard(content: string): void {
  try {
    if (process.platform === 'win32') {
      execSync(
        'powershell.exe -NoProfile -Command "Set-Clipboard -Value ([Environment]::GetEnvironmentVariable(\'CLIP_TEXT\'))"',
        {
          env: { ...process.env, CLIP_TEXT: content },
          stdio: ['pipe', 'pipe', 'ignore'],
        },
      );
      return;
    }
    if (process.platform === 'darwin') {
      execSync('pbcopy', { input: content, stdio: ['pipe', 'pipe', 'ignore'] });
      return;
    }
    execSync('xclip -selection clipboard', { input: content, stdio: ['pipe', 'pipe', 'ignore'] });
  } catch {}
}

export function sendNotification(title: string, message: string): void {
  try {
    if (process.platform === 'darwin') {
      execSync(`osascript -e 'display notification "${message}" with title "${title}"'`, {
        stdio: ['pipe', 'pipe', 'ignore'],
      });
    } else if (process.platform === 'win32') {
      const psCmd = `[reflection.assembly]::loadwithpartialname('System.Windows.Forms'); $notify = new-object system.windows.forms.notifyicon; $notify.icon = [system.drawing.systemicons]::information; $notify.visible = $true; $notify.showballoontip(3000, '${title}', '${message}', [system.windows.forms.tooltipicon]::info)`;
      execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, {
        stdio: ['pipe', 'pipe', 'ignore'],
      });
    } else if (process.platform === 'linux') {
      execSync(`notify-send "${title}" "${message}"`, {
        stdio: ['pipe', 'pipe', 'ignore'],
      });
    }
  } catch {}
}

export function formatNotificationMessage(sessionMap?: Record<string, string>): string {
  if (!sessionMap) return 'Scrubbed 0 items';
  const keys = Object.keys(sessionMap);
  if (keys.length === 0) return 'Scrubbed 0 items';

  const counts: Record<string, number> = {};
  for (const key of keys) {
    const cleanKey = key.replace(/[«»]/g, '');
    const prefix = cleanKey.split('_')[0] || 'item';
    const category = prefix.toLowerCase();
    counts[category] = (counts[category] || 0) + 1;
  }

  const parts = Object.entries(counts).map(([cat, cnt]) => {
    const name = cnt === 1 ? cat : `${cat}s`;
    return `${cnt} ${name}`;
  });

  return `Scrubbed ${parts.join(', ')}`;
}

export async function watchClipboardStep(
  lastContent: string,
  options: {
    sessionId?: string;
    disable?: string;
    enable?: string;
    strictName?: boolean;
    codeTellTerms?: string;
    urlAllowlist?: string;
    readClipboardFn?: () => string;
    writeClipboardFn?: (text: string) => void;
    logFn?: (msg: string) => void;
    notifyFn?: (title: string, msg: string) => void;
  },
): Promise<string> {
  const readFn = options.readClipboardFn ?? readClipboard;
  const writeFn = options.writeClipboardFn ?? writeClipboard;
  const log = options.logFn ?? console.log;
  const notify = options.notifyFn ?? sendNotification;

  const current = readFn();
  if (current && current !== lastContent) {
    const result = await handleScrub(current, options);
    // Watch mode only handles string content
    const scrubbed = typeof result.scrubbedContent === 'string' ? result.scrubbedContent : current;
    if (scrubbed !== current) {
      writeFn(scrubbed);
      const msg = formatNotificationMessage(result.sessionMap);
      log(`[watch] ${msg} from clipboard.`);
      notify('prompt-scrub', msg);
      return scrubbed;
    }
    return current;
  }
  return lastContent;
}

export async function watchFileStep(
  filePath: string,
  lastContent: string,
  options: {
    sessionId?: string;
    disable?: string;
    enable?: string;
    strictName?: boolean;
    codeTellTerms?: string;
    urlAllowlist?: string;
    logFn?: (msg: string) => void;
    notifyFn?: (title: string, msg: string) => void;
  },
): Promise<string> {
  const log = options.logFn ?? console.log;
  const notify = options.notifyFn ?? sendNotification;
  if (!existsSync(filePath)) {
    return lastContent;
  }
  const current = readFileSync(filePath, 'utf8');
  if (current !== lastContent) {
    const result = await handleScrub(current, options);
    // Watch mode only handles string content
    const scrubbed = typeof result.scrubbedContent === 'string' ? result.scrubbedContent : current;
    if (scrubbed !== current) {
      writeFileSync(filePath, scrubbed, 'utf8');
      const msg = formatNotificationMessage(result.sessionMap);
      log(`[watch] ${msg} in ${filePath}.`);
      notify('prompt-scrub', `${msg} in ${filePath}`);
      return scrubbed;
    }
    return current;
  }
  return lastContent;
}

export async function handleWatch(options: {
  clipboard?: boolean;
  file?: string | string[];
  interval?: string;
  once?: boolean;
  sessionId?: string;
  disable?: string;
  enable?: string;
  strictName?: boolean;
  codeTellTerms?: string;
  urlAllowlist?: string;
  readClipboardFn?: () => string;
  writeClipboardFn?: (text: string) => void;
  logFn?: (msg: string) => void;
  notifyFn?: (title: string, msg: string) => void;
}) {
  if (!options.clipboard && !options.file) {
    throw new Error('Must specify --clipboard or --file <file>');
  }

  const intervalMs = Number.parseInt(options.interval || '1000', 10) || 1000;
  const readFn = options.readClipboardFn ?? readClipboard;
  let lastClip = options.clipboard ? readFn() : '';

  const files = options.file ? (Array.isArray(options.file) ? options.file : [options.file]) : [];

  const lastFileContents: Record<string, string> = {};

  const tick = async () => {
    if (options.clipboard) {
      lastClip = await watchClipboardStep(lastClip, options);
    }
    for (const f of files) {
      lastFileContents[f] = await watchFileStep(f, lastFileContents[f] ?? '', options);
    }
  };

  await tick();

  if (options.once) {
    return;
  }

  const timer = setInterval(() => {
    tick().catch(() => {});
  }, intervalMs);

  return timer;
}

export function setupWatchCommand(program: Command) {
  program
    .command('watch')
    .description('Monitor system clipboard or specific files and automatically scrub content')
    .option('-c, --clipboard', 'Monitor system clipboard')
    .option('-f, --file <files...>', 'File(s) to monitor')
    .option('-i, --interval <ms>', 'Polling interval in milliseconds', '1000')
    .option('--once', 'Run a single check pass and exit')
    .option('--session-id <id>', 'Resume or target a specific session')
    .option('--disable <detectors>', 'Comma-separated list of detector names to skip')
    .option('--enable <detectors>', 'Comma-separated list of off-by-default detectors to enable')
    .option('--strict-name', 'Enable strict allowlisting for NameDetector')
    .option('--code-tell-terms <terms>', 'Comma-separated list of private terms to detect')
    .option('--url-allowlist <hosts>', 'Comma-separated list of hostnames to pass-through')
    .action(async (options) => {
      try {
        await handleWatch(options);
      } catch (err: unknown) {
        console.error((err as Error).message);
        process.exit(1);
      }
    });
}
