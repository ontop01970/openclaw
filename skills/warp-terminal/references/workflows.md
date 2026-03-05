# Warp Workflows Guide

## Overview

Warp Workflows are reusable command sequences that can be saved and shared. They're ideal for frequently-used command patterns.

## Accessing Workflows

**Keyboard shortcut:** `Ctrl+Shift+R` (Linux/Windows) or `Cmd+Shift+R` (macOS)

**Or:** Open Command Palette and search for "workflows"

## Creating Workflows

### Via UI

1. Run the commands you want to save
2. Open workflows panel (`Ctrl+Shift+R`)
3. Click "Save as Workflow"
4. Name the workflow and add description
5. Save

### Workflow File Format

Workflows are stored as YAML files in `~/.warp/workflows/`

Example workflow:

```yaml
name: "Deploy to Production"
description: "Build and deploy the app"
commands:
  - npm run build
  - npm run test
  - git push origin main
  - ./scripts/deploy.sh
```

## Using Workflows

1. Open workflows panel (`Ctrl+Shift+R`)
2. Search or browse for the workflow
3. Click to execute

## Workflow Best Practices

### Parameterization

Use environment variables for flexibility:

```yaml
name: "Git Branch Deploy"
commands:
  - git checkout ${BRANCH_NAME}
  - npm install
  - npm run deploy
```

### Documentation

Add clear descriptions:

```yaml
name: "Database Migration"
description: "Run database migrations and seed data. Use on staging before production."
commands:
  - npm run db:migrate
  - npm run db:seed
```

### Error Handling

Include validation steps:

```yaml
name: "Safe Deploy"
commands:
  - npm run test || exit 1
  - npm run lint || exit 1
  - git status
  - read -p "Continue with deploy? (y/n) " -n 1 -r
  - if [[ $REPLY =~ ^[Yy]$ ]]; then npm run deploy; fi
```

## Sharing Workflows

### Export

Workflows can be shared by copying files from `~/.warp/workflows/`

### Import

Place workflow YAML files in `~/.warp/workflows/` and restart Warp

## Common Workflow Patterns

### Development Server Start

```yaml
name: "Start Dev Environment"
commands:
  - docker-compose up -d
  - npm install
  - npm run dev
```

### Git Workflow

```yaml
name: "Git PR Workflow"
commands:
  - git pull origin main
  - git checkout -b ${BRANCH_NAME}
  - git add .
  - git commit -m "${COMMIT_MESSAGE}"
  - git push origin ${BRANCH_NAME}
```

### Testing

```yaml
name: "Full Test Suite"
commands:
  - npm run lint
  - npm run test:unit
  - npm run test:integration
  - npm run test:e2e
```

## Integration with OpenClaw

OpenClaw can:

- Suggest creating workflows for repeated command patterns
- Help users find appropriate workflows for tasks
- Generate workflow YAML files programmatically
- Execute workflows via Warp CLI

Example OpenClaw interaction:

```
User: "I need to deploy the app"
OpenClaw: "I see you have a 'Deploy to Production' workflow saved.
          Would you like me to run it, or create a new deployment workflow?"
```
