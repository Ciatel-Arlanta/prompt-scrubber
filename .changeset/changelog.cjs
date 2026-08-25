/**
 * Custom Changesets changelog formatter for prompt-scrub.
 *
 * Each changeset file's markdown body IS the changelog entry, verbatim - the
 * same curated voice we already use in CHANGELOG.md. We deliberately drop the
 * commit-hash / PR-link decoration that the default formatter adds, so the
 * rendered CHANGELOG.md stays clean prose.
 *
 * The structural cleanup (heading level, removing the "### Patch Changes"
 * group headers) happens afterwards in scripts/normalize-changelog.js, which
 * runs as part of `changeset:version`.
 */

async function getReleaseLine(changeset) {
  const summary = (changeset.summary || '').trim();
  if (!summary) return '';

  const isMarkdownList = /^\s*[-*]\s/.test(summary);
  const body = isMarkdownList ? summary : `- ${summary}`;

  return `\n${body}`;
}

async function getDependencyReleaseLine() {
  return '';
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
  default: { getReleaseLine, getDependencyReleaseLine },
};
