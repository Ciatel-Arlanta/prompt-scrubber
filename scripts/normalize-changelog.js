#!/usr/bin/env node

/**
 * Post-process CHANGELOG.md after `changeset version` so the freshly written
 * top section matches prompt-scrub's long-standing house style:
 *
 *   - Changesets writes the new release as a level-2 heading ("## 1.1.0")
 *     under the package title. We use level-1 version headings ("# 1.1.0").
 *   - Changesets groups entries under "### Major/Minor/Patch Changes" headers.
 *     We keep a single flat bullet list, and those "###" headers additionally
 *     break scripts/extract-changelog.js (its capture stops at the first "##+"
 *     heading), so they must go.
 *
 * The package-title H1 ("# @nanocollective/prompt-scrub") is kept permanently
 * at the top of the file - Changesets needs a non-version first line to prepend
 * new releases in the right place.
 *
 * The script is idempotent: if the newest section is already normalised (a
 * level-1 heading), it does nothing.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = join(rootDir, 'CHANGELOG.md');

const raw = readFileSync(changelogPath, 'utf8');

const sections = raw.split(/\n(?=#{1,2} \d)/);

if (sections.length < 2) {
  process.exit(0);
}

const newest = sections[1];

if (!/^## \d/.test(newest)) {
  process.exit(0);
}

let normalized = newest
  .replace(/^## /, '# ')
  .replace(/^### (?:Major|Minor|Patch) Changes[^\n]*\n?/gm, '');

normalized = normalized.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');

sections[1] = `${normalized}\n`;

writeFileSync(changelogPath, sections.join('\n'), 'utf8');
console.log('CHANGELOG.md normalised to house style');
