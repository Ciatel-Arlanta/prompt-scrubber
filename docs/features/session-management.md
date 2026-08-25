---
title: "Session Management"
description: "How prompt-scrub persists placeholder mappings locally"
sidebar_order: 1
---

# Session Management

The session manager is responsible for keeping track of original values and their assigned placeholders, ensuring that the same entity gets the same placeholder throughout a single session.

## Data Structure

A session map is a simple key-value dictionary where the key is the placeholder and the value is the original string.

```json
{
  "Email_1": "john@example.com",
  "Path_1": "/Users/john/project",
  "Secret_1": "sk-xxxxx"
}
```

## Storage Location

Sessions are stored as JSON files on disk in the user's config directory:
- **macOS**: `~/Library/Application Support/prompt-scrub/sessions/<id>.json`
- **Linux**: `${XDG_CONFIG_HOME:-~/.config}/prompt-scrub/sessions/<id>.json`
- **Windows**: `%APPDATA%\prompt-scrub\sessions\<id>.json`

## Lifecycle & Expiry

- **Creation**: Sessions are created on-demand. If no session ID is provided to the CLI or the API, a new one is generated.
- **Duration**: By default, sessions automatically expire after 7 days of inactivity. This is configurable via the `sessionTtlDays` option in the config file. Expired sessions are automatically pruned during regular operations, or manually via `prompt-scrub sessions gc`. Users can also explicitly remove sessions via the `prompt-scrub sessions rm <id>` command.
- **Duplicates**: If a session ID already exists, the manager loads it and appends new identifiers. Existing identifiers maintain their previously assigned placeholder mappings. If the same value is encountered again (e.g., "john@example.com"), the system reuses `Email_1` instead of creating `Email_2`.

## ID Generation

When auto-generated, session IDs are UUIDs (v4) to ensure uniqueness without central coordination.
