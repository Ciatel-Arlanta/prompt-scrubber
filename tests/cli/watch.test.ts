import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'ava';
import {
  formatNotificationMessage,
  handleWatch,
  watchClipboardStep,
  watchFileStep,
} from '../../src/cli/commands/watch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tmpDir = path.join(__dirname, '.tmp-cli-watch-full');

test.before(() => {
  process.env.PROMPT_SCRUB_CONFIG_DIR = tmpDir;
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
});

test.after.always(() => {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('formatNotificationMessage correctly formats single and plural categories', (t) => {
  t.is(formatNotificationMessage(undefined), 'Scrubbed 0 items');
  t.is(formatNotificationMessage({}), 'Scrubbed 0 items');
  t.is(formatNotificationMessage({ Secret_1: 'val1', Secret_2: 'val2' }), 'Scrubbed 2 secrets');
  t.is(
    formatNotificationMessage({ Secret_1: 'val1', Email_1: 'val2' }),
    'Scrubbed 1 secret, 1 email',
  );
});

test('watchClipboardStep scrubs sensitive data, logs, and triggers notification', async (t) => {
  let written = '';
  let logged = '';
  let notifiedTitle = '';
  let notifiedMsg = '';

  const mockRead = () => 'Contact user@example.com immediately';
  const mockWrite = (text: string) => {
    written = text;
  };
  const mockLog = (msg: string) => {
    logged = msg;
  };
  const mockNotify = (title: string, msg: string) => {
    notifiedTitle = title;
    notifiedMsg = msg;
  };

  const next = await watchClipboardStep('', {
    readClipboardFn: mockRead,
    writeClipboardFn: mockWrite,
    logFn: mockLog,
    notifyFn: mockNotify,
  });

  t.is(next, 'Contact «Email_1» immediately');
  t.is(written, 'Contact «Email_1» immediately');
  t.true(logged.includes('[watch] Scrubbed 1 email from clipboard.'));
  t.is(notifiedTitle, 'prompt-scrub');
  t.is(notifiedMsg, 'Scrubbed 1 email');
});

test('watchClipboardStep does nothing when clipboard has not changed', async (t) => {
  let writeCalled = false;
  const mockRead = () => 'Contact user@example.com immediately';
  const mockWrite = () => {
    writeCalled = true;
  };

  const current = 'Contact user@example.com immediately';
  const next = await watchClipboardStep(current, {
    readClipboardFn: mockRead,
    writeClipboardFn: mockWrite,
  });

  t.is(next, current);
  t.false(writeCalled);
});

test('watchFileStep scrubs file content when file changes and triggers notification', async (t) => {
  const filePath = path.join(tmpDir, 'test-watch-file.txt');
  fs.writeFileSync(filePath, 'Send key sk-1234567890abcdef1234567890abcdef here', 'utf8');

  let logged = '';
  let notifiedMsg = '';
  const mockLog = (msg: string) => {
    logged = msg;
  };
  const mockNotify = (_title: string, msg: string) => {
    notifiedMsg = msg;
  };

  const next = await watchFileStep(filePath, '', {
    logFn: mockLog,
    notifyFn: mockNotify,
  });

  t.is(next, 'Send key «Secret_1» here');
  t.is(fs.readFileSync(filePath, 'utf8'), 'Send key «Secret_1» here');
  t.true(logged.includes('[watch] Scrubbed 1 secret in'));
  t.true(notifiedMsg.includes('Scrubbed 1 secret in'));
});

test('handleWatch supports watching multiple files', async (t) => {
  const file1 = path.join(tmpDir, 'f1.txt');
  const file2 = path.join(tmpDir, 'f2.txt');
  fs.writeFileSync(file1, 'Email: alice@example.com', 'utf8');
  fs.writeFileSync(file2, 'Key: sk-1234567890abcdef1234567890abcdef', 'utf8');

  let logCount = 0;
  const mockLog = () => {
    logCount++;
  };

  await handleWatch({
    file: [file1, file2],
    once: true,
    logFn: mockLog,
  });

  t.is(fs.readFileSync(file1, 'utf8'), 'Email: «Email_1»');
  t.is(fs.readFileSync(file2, 'utf8'), 'Key: «Secret_1»');
  t.is(logCount, 2);
});

test('handleWatch throws when neither --clipboard nor --file is provided', async (t) => {
  await t.throwsAsync(
    async () => {
      await handleWatch({});
    },
    { message: 'Must specify --clipboard or --file <file>' },
  );
});
