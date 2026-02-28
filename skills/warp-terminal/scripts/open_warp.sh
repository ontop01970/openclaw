#!/usr/bin/env bash
# Helper script to open Warp terminal with optional directory and commands

set -euo pipefail

WARP_DIR="${1:-.}"
WARP_CMD="${2:-}"

# Check if warp-cli is available
if ! command -v warp-cli &> /dev/null; then
    echo "Error: warp-cli not found. Please install Warp terminal."
    echo "Download from: https://www.warp.dev/"
    exit 1
fi

# Open Warp in the specified directory
if [ -n "$WARP_CMD" ]; then
    # Open with command
    cd "$WARP_DIR" && warp-cli run "$WARP_CMD"
else
    # Just open the directory
    warp-cli open --cwd "$WARP_DIR"
fi
