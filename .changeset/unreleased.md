---
"@nanocollective/prompt-scrub": minor
---

Add a `watch` command for real-time clipboard/file monitoring with auto-scrubbing (`--clipboard`, `--file <files...>`, plus `--dry-run`, `--backup`, `--interval`, `--once`, `--session-id`, `--disable`/`--enable`, `--url-allowlist`; cross-platform Win/macOS/Linux, clean `Ctrl-C` exit, install hints for missing `xclip`/`notify-send`/`osascript`); a one-line `scrub` summary printed to stderr with a `-q`/`--quiet` flag for pipelines, also exposed to library callers as `result.stats` (`totalEntities`, `byCategory`); and `init` + `config show` commands to scaffold and inspect the global config. Fix: cross-platform build script (`rm -rf` → Node `fs.rmSync`); phone-detector span start index; common-name detection in strict mode; watch-mode review feedback. Thanks to @addyCooks and @prashantbhudwal.
