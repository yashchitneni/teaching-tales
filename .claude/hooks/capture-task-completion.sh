#!/bin/bash

# Claude Code hook that runs automatically after task-master set-status --status=done
# Receives tool call info via stdin

# Read the tool call data from stdin
TOOL_DATA=$(cat)

# Extract the command from the JSON input
COMMAND=$(echo "$TOOL_DATA" | grep -o 'task-master set-status[^"]*' | head -1)

# Extract task ID from the command
TASK_ID=$(echo "$COMMAND" | grep -o -- '--id=[^ ]*' | cut -d'=' -f2)

if [ -z "$TASK_ID" ]; then
  echo "Could not extract task ID from command"
  exit 0
fi

# Get the current directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Get git changes
cd "$PROJECT_DIR"
FILES_CHANGED=$(git status --porcelain 2>/dev/null | awk '{print $2}' | grep -v '^$' | paste -sd ',' -)

# Create history entry
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
HISTORY_FILE="$PROJECT_DIR/.taskmaster/task_history.json"

# Read task details
TASKS_FILE="$PROJECT_DIR/.taskmaster/tasks/tasks.json"
if [ -f "$TASKS_FILE" ]; then
  TASK_TITLE=$(node -e "
    const tasks = require('$TASKS_FILE');
    const findTask = (tasks, id) => {
      for (const t of tasks.master.tasks) {
        if (t.id.toString() === '$TASK_ID') {
          console.log(t.title);
          return;
        }
        if (t.subtasks) {
          const sub = t.subtasks.find(s => t.id + '.' + s.id === '$TASK_ID');
          if (sub) {
            console.log(sub.title);
            return;
          }
        }
      }
    };
    findTask(tasks);
  " 2>/dev/null)
fi

# Create or update history
if [ ! -f "$HISTORY_FILE" ]; then
  echo '{"history":[],"metadata":{"created":"'$TIMESTAMP'","version":"1.0.0"}}' > "$HISTORY_FILE"
fi

# Add entry to history using node
node -e "
  const fs = require('fs');
  const history = JSON.parse(fs.readFileSync('$HISTORY_FILE', 'utf-8'));
  const entry = {
    taskId: '$TASK_ID',
    taskTitle: '$TASK_TITLE' || 'Task $TASK_ID',
    completedAt: '$TIMESTAMP',
    filesEdited: '${FILES_CHANGED}'.split(',').filter(f => f),
    implementationSummary: 'Automatically captured on task completion',
    dependencies: []
  };
  history.history.push(entry);
  fs.writeFileSync('$HISTORY_FILE', JSON.stringify(history, null, 2));
"

echo "✅ Task $TASK_ID completion recorded in history"