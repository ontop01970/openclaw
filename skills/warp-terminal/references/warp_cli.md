# Warp CLI Reference

## Overview

Warp provides a command-line interface (`warp-cli`) for programmatic interaction with the terminal.

## Installation

Warp CLI is included with Warp terminal installation. Download from: https://www.warp.dev/

## Commands

### open

Open a new Warp window.

```bash
warp-cli open
```

**Options:**
- `--cwd <directory>` - Open in specified directory
- `--new-tab` - Open in a new tab instead of window

**Examples:**
```bash
# Open in current directory
warp-cli open

# Open in specific directory
warp-cli open --cwd /home/user/projects

# Open in new tab
warp-cli open --new-tab
```

### run

Execute a command in Warp.

```bash
warp-cli run "<command>"
```

**Examples:**
```bash
# Single command
warp-cli run "git status"

# Multiple commands
warp-cli run "cd /tmp && ls -la"

# Background process
warp-cli run "npm run dev &"
```

### list

List all open Warp windows and tabs.

```bash
warp-cli list
```

## Environment Variables

- `WARP_THEME` - Set default theme
- `WARP_USE_SSH_WRAPPER` - Enable/disable SSH wrapper

## Integration Tips

### With OpenClaw

OpenClaw can use `warp-cli` to:
- Open terminals for user review of commands
- Execute commands that benefit from Warp's AI features
- Create workflows for repeated command sequences

### Script Integration

```bash
#!/bin/bash
# Example: Open Warp and run tests
warp-cli open --cwd "$PROJECT_DIR"
warp-cli run "npm test"
```

## Troubleshooting

### warp-cli not found

Ensure Warp is installed and the CLI is in your PATH:
```bash
which warp-cli
```

If not found, add Warp's bin directory to PATH or reinstall Warp.

### Commands not executing

Check that commands are properly quoted:
```bash
# Correct
warp-cli run "echo 'hello world'"

# Incorrect
warp-cli run echo hello world
```
