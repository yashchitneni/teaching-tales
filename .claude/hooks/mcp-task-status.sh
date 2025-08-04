#!/bin/bash

# Claude Code hook for MCP task status changes

# Read the tool call data from stdin
TOOL_DATA=$(cat)

# Extract task ID and status from the JSON
TASK_ID=$(echo "$TOOL_DATA" | grep -o '"id":[[:space:]]*"[^"]*"' | cut -d'"' -f4)
STATUS=$(echo "$TOOL_DATA" | grep -o '"status":[[:space:]]*"[^"]*"' | cut -d'"' -f4)

if [ -z "$TASK_ID" ] || [ -z "$STATUS" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Handle different statuses
case "$STATUS" in
  "done")
    # Run completion capture
    "$PROJECT_DIR/.claude/hooks/capture-task-completion.sh" <<< "$TOOL_DATA"
    ;;
  "in-progress")
    # Show task context
    "$PROJECT_DIR/.claude/hooks/show-task-context.sh" <<< "$TOOL_DATA"
    ;;
esac