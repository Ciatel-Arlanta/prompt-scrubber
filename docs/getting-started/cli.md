---
title: "CLI Reference"
description: "Using the prompt-scrub command-line tool"
sidebar_order: 1
---

# CLI Reference

The `prompt-scrub` package provides a command-line interface for manual inspection, scripting, and pipeline integration. 

## Core Commands

### `prompt-scrub scrub [file]`
Reads a message from `stdin` or a file and prints the scrubbed message to `stdout`. The session ID and a summary of what was replaced are printed to `stderr`, so `stdout` stays clean for piping.

```bash
echo "Mail alice@acme.com about sk-abcdefghijklmnopqrstuvwxyz" | prompt-scrub scrub
```

```
Mail «Email_1» about «Secret_1»
Session ID: 6f1c2b90-0d3a-4f8e-9a21-2b7c1e4d5a63
Scrubbed: 2 entities (1 Email, 1 Secret)
```

The summary counts replacements, not unique values: a value that appears three times counts three times, even though all three collapse onto the same placeholder. Reusing a session with `--session-id` does not carry counts over — the summary always describes the current run only. When nothing is detected the summary reads `Scrubbed: 0 entities`.

**Options:**
- `--session-id <id>`: Reuse an existing session map. If omitted, a new UUID is generated.
- `--disable <detectors>`: Comma-separated list of detectors to disable (e.g. `EmailDetector,PhoneDetector`).
- `-q, --quiet`: Suppress the summary. The `Session ID:` line is still printed, since scripts need it to rehydrate.

### `prompt-scrub rehydrate [file]`
Reads a scrubbed response from `stdin` or a file and prints the rehydrated response to `stdout`.

**Warnings (stderr):**
If the model hallucinates a placeholder that does not exist in the session map (e.g., the model outputs `Secret_2` but only `Secret_1` was scrubbed), the tool passes the string through unchanged to `stdout`, but emits a warning directly to `stderr`.

**Options:**
- `--session-id <id>` (Required): The session ID used during the `scrub` phase to restore original values.

### `prompt-scrub inspect [file]`
Reads a message from `stdin` or a file and prints a human-readable diff of the transformations the scrubber will apply. Also prints a SHA-256 hash of the final byte-stable output for verifying prompt cache deterministic prefix stability.

**Options:**
- `--disable <detectors>`: Comma-separated list of detectors to disable.
- `--hash`: Print *only* the SHA-256 hash for scripting purposes.

## Session Management

### `prompt-scrub sessions list`
Lists all known session IDs currently stored on disk along with their file sizes.

### `prompt-scrub sessions show <id>`
Prints the raw JSON contents of a session map for inspection or manual editing.

### `prompt-scrub sessions rm <id>`
Deletes a session map from the disk permanently.

## Utility

### `prompt-scrub --version`
Prints the current version of the CLI.

### `prompt-scrub --help`
Prints standard help documentation and available commands.
