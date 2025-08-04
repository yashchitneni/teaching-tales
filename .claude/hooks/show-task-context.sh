#!/bin/bash

# Claude Code hook that runs automatically after task-master set-status --status=in-progress
# Shows context from dependent tasks

# Read the tool call data from stdin
TOOL_DATA=$(cat)

# Extract the command
COMMAND=$(echo "$TOOL_DATA" | grep -o 'task-master set-status[^"]*' | head -1)

# Extract task ID
TASK_ID=$(echo "$COMMAND" | grep -o -- '--id=[^ ]*' | cut -d'=' -f2)

if [ -z "$TASK_ID" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HISTORY_FILE="$PROJECT_DIR/.taskmaster/task_history.json"
TASKS_FILE="$PROJECT_DIR/.taskmaster/tasks/tasks.json"

# Show task context using node
node -e "
  const fs = require('fs');
  
  // Read tasks
  const tasks = JSON.parse(fs.readFileSync('$TASKS_FILE', 'utf-8'));
  
  // Find current task
  let currentTask = null;
  for (const t of tasks.master.tasks) {
    if (t.id.toString() === '$TASK_ID') {
      currentTask = t;
      break;
    }
    if (t.subtasks) {
      const sub = t.subtasks.find(s => t.id + '.' + s.id === '$TASK_ID');
      if (sub) {
        currentTask = {...sub, parentId: t.id};
        break;
      }
    }
  }
  
  if (!currentTask) {
    console.log('Task not found');
    process.exit(0);
  }
  
  console.log('\\n🚀 Starting Task ' + '$TASK_ID' + ': ' + currentTask.title);
  console.log('━'.repeat(60));
  
  // Show dependencies if any
  if (currentTask.dependencies && currentTask.dependencies.length > 0) {
    console.log('\\n📋 Context from dependent tasks:');
    
    if (fs.existsSync('$HISTORY_FILE')) {
      const history = JSON.parse(fs.readFileSync('$HISTORY_FILE', 'utf-8'));
      
      for (const depId of currentTask.dependencies) {
        const depHistory = history.history.find(h => h.taskId.toString() === depId.toString());
        
        if (depHistory) {
          console.log('\\n📌 Task ' + depId + ': ' + depHistory.taskTitle);
          console.log('   Completed: ' + new Date(depHistory.completedAt).toLocaleDateString());
          
          if (depHistory.filesEdited && depHistory.filesEdited.length > 0) {
            console.log('   Files edited:');
            depHistory.filesEdited.forEach(file => {
              console.log('     - ' + file);
            });
          }
        }
      }
    }
  }
  
  console.log('\\n' + '━'.repeat(60));
"