---
name: warp-terminal
description: Execute commands and interact with Warp terminal. Use when needing to run shell commands, open terminal windows, create workflows, or leverage Warp-specific features like AI command search, workflows, and notebook mode. Triggers on requests to open terminals, run commands in Warp, save command workflows, or access Warp AI features.
---

# Warp Terminal

## Overview

This skill enables interaction with Warp, a modern terminal with AI-powered features. It provides command execution, workflow management, and integration with Warp's unique capabilities like AI command search and notebook mode.

## Quick Start

Open Warp terminal:

```bash
warp-cli open
```

Run a command in a new Warp window:

```bash
warp-cli run "ls -la"
```

## Core Capabilities

### 1. Opening Terminal Windows

Open a new Warp window:

```bash
warp-cli open
```

Open in a specific directory:

```bash
warp-cli open --cwd /path/to/directory
```

### 2. Command Execution

Execute a single command:

```bash
warp-cli run "git status"
```

Execute multiple commands:

```bash
warp-cli run "cd /home/user && ls -la && git status"
```

### 3. Workflow Management

Warp workflows are saved command sequences. Access them via:

- `Ctrl+Shift+R` (default keybinding)
- Or through the Warp UI

Create a workflow by saving commonly used command sequences in Warp's workflow UI.

### 4. AI Command Search

Warp's AI features (accessed via `Ctrl+~` or command palette):

- Natural language to command translation
- Command explanation
- Error diagnosis

When suggesting commands, mention that users can use Warp AI to refine or explain them.

## Integration Patterns

### Opening Terminal for User Review

When commands require user interaction or review:

```bash
warp-cli open --cwd /path/to/project
# Then mention: "Opening Warp in the project directory. You can now run..."
```

### Running Background Tasks

For long-running commands:

```bash
warp-cli run "npm run dev > /tmp/dev.log 2>&1 &"
```

### Multi-Step Workflows

For complex sequences, use script references:

```bash
bash scripts/warp_workflow.sh
```

## Best Practices

- Use `warp-cli` for programmatic terminal interaction
- Suggest Warp AI features (`Ctrl+~`) for command discovery
- For complex workflows, save them as Warp workflows rather than scripts
- Leverage notebook mode for documentation-heavy command sequences

## Resources

### scripts/

Utility scripts for Warp integration:

- `open_warp.sh` - Opens Warp with specified directory and commands
- `create_workflow.sh` - Helper for creating Warp workflow files

### references/

- `warp_cli.md` - Complete Warp CLI reference and examples
- `workflows.md` - Guide to creating and managing Warp workflows
