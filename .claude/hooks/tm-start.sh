#!/bin/bash

# Wrapper script for starting a task with context

if [ -z "$1" ]; then
  echo "Usage: tm-start.sh <task-id>"
  exit 1
fi

TASK_ID=$1

# Run the start hook to show context
node "$(dirname "$0")/task-start.js" "$TASK_ID"

# Mark task as in-progress
task-master set-status --id="$TASK_ID" --status=in-progress

# Show full task details
echo ""
task-master show "$TASK_ID"