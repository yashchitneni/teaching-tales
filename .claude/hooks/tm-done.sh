#!/bin/bash

# Wrapper script for marking a task as done with implementation notes

if [ -z "$1" ]; then
  echo "Usage: tm-done.sh <task-id> [implementation notes]"
  exit 1
fi

TASK_ID=$1
IMPLEMENTATION_NOTES="${@:2}"

# Export notes for the hook to pick up
export TASK_IMPLEMENTATION_NOTES="$IMPLEMENTATION_NOTES"

# Mark task as done
task-master set-status --id="$TASK_ID" --status=done

# Run the completion hook
node "$(dirname "$0")/task-complete.js" "$TASK_ID"

# Show next task
echo ""
task-master next