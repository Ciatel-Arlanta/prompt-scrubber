# Contributing to prompt-scrub

Welcome! We are glad you're here. `prompt-scrub` is an open-source project by the Nano Collective. We welcome contributors of all skill levels. Whether you are fixing a bug, adding a new detector, or improving documentation, your help is appreciated.

## Code of Conduct

All contributors and participants are expected to adhere to the [Nano Collective Code of Conduct](https://nanocollective.org/collective/organisation/community). Please review it before participating.

We also operate under the [Nano Collective Economics Charter](https://nanocollective.org/collective/organisation/economics-charter).

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nano-Collective/prompt-scrubber.git
   cd prompt-scrubber
   ```

2. **Install dependencies:**
   We use pnpm for development. If you don't have it, you can bootstrap it via Corepack:
   ```bash
   corepack enable && corepack prepare pnpm@11.0.9 --activate
   pnpm install
   ```

3. **Build the project:**
   ```bash
   pnpm run build
   ```

## Testing and Linting

We maintain a high bar for quality and test coverage. Before submitting a PR, ensure your changes pass the full test and linting gate.

You can run the entire check in one command:
```bash
pnpm run test:all
```

This single command will run through the following gates:
- `pnpm run test:format` - Format checking with Biome
- `pnpm run test:types` - Type checking with tsc
- `pnpm run test:lint` - Lint checking with Biome
- `pnpm run test:ava` - Ava test suite
- `pnpm run test:knip` - Dead code analysis
- `pnpm run test:audit` - Security audit of dependencies
- `pnpm run test:security` - Static analysis with Semgrep (if installed)

You can also run any of these individual gates in isolation by calling the script name.

### Coding Standards

- **Strictness:** We use strict TypeScript. Avoid `any` where possible.
- **Error Handling:** Use clear, descriptive error messages. Throw native `Error` objects or specific subclasses.
- **Formatting:** Handled automatically by Biome. Do not disable lint rules without a comment explaining why.

## Release Process

**Cutting a release is handled exclusively by code owners / maintainers.** Contributors should not bump the version, edit `CHANGELOG.md` directly, or write a release commit - these are maintainer responsibilities. Contributors DO, however, add a changeset to their PR (see below); that is how your change gets a changelog entry.

We use [Changesets](https://github.com/changesets/changesets) to manage versions and the changelog. The short version:

- Every user-facing PR includes a `.changeset/*.md` file describing the change (written by the author, in our changelog voice).
- A bot keeps a single open "Version Packages" PR that accumulates those entries and rolls them into `CHANGELOG.md` with the version bump.
- A maintainer cuts a release simply by merging that PR. The existing `release.yml` then publishes to npm and creates the GitHub Release automatically.

### Adding a changeset (contributors)

When your change is user-facing, add a changeset before your PR is merged:

```bash
pnpm changeset
```

Pick the bump type and write the entry:

- **Patch** (`1.0.2` -> `1.0.3`) - bug fixes only, no behavior changes
- **Minor** (`1.0.2` -> `1.1.0`) - new features, backwards-compatible
- **Major** - breaking changes

The markdown body you write IS the changelog entry, verbatim. Follow the existing voice: a self-contained bullet describing user-facing impact, with attribution where relevant (`Thanks to @username. Closes #123.`). Commit the generated `.changeset/*.md` file with your PR.

If your PR is docs-only or a chore that needs no release note, you can skip the changeset (a bot will leave a friendly reminder you can ignore), or record the intent explicitly with `pnpm changeset --empty`.

### Cutting the release (maintainers)

Do each step in order - skipping the test gate is how broken releases ship.

1. **Ensure all tests pass on `main`** before merging the Version Packages PR. The release workflow does run the full test suite, but a green `main` saves a re-run.
2. **Review the Version Packages PR.** It will contain:
   - The version bump in `package.json` (patch / minor / major, depending on the changesets).
   - A new section at the top of `CHANGELOG.md` (`# X.Y.Z`) with the rolled-up entries.
   - Deletion of the consumed `.changeset/*.md` files.
3. **Merge the Version Packages PR.** Merging pushes a version bump to `main`, which `release.yml` detects and publishes.
4. **Verify the release.** `release.yml` will publish to npm (under `latest`, or `alpha`/`beta`/`rc` for prereleases), create a GitHub Release, and post a summary in the action log.

### Required secrets (maintainers only)

| Secret | Purpose |
|---|---|
| `NPM_TOKEN` | Authenticates `npm publish` to the npm registry. Must be set as a repository secret. |

Thank you for contributing!
