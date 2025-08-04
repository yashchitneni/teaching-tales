# Task History Tracking System - Automatic Hooks

This system uses Claude Code's built-in hooks feature to automatically track implementation history when tasks are completed and provide context when starting new tasks.

## How It Works

### Automatic Hooks

The system automatically triggers when you use TaskMaster commands:

1. **When marking a task as done:**
   ```bash
   task-master set-status --id=1.1 --status=done
   ```
   Automatically captures:
   - Files changed (from git)
   - Task completion timestamp
   - Task details

2. **When starting a task:**
   ```bash
   task-master set-status --id=2 --status=in-progress
   ```
   Automatically shows:
   - Implementation history from dependent tasks
   - Files that were edited in those tasks

### Manual Commands (Optional)

You can still use the manual commands for more control:

```bash
# Complete a task with custom notes
./.claude/hooks/tm-done.sh 1.1 "Implemented API client with axios"

# Start a task with context
./.claude/hooks/tm-start.sh 2
```

## Configuration

The hooks are configured in `.claude/settings.local.json` and match:
- Bash commands containing `task-master set-status`
- MCP tool calls to `set_task_status`

## File Structure

- `.taskmaster/task_history.json` - Stores all task completion history
- `.claude/hooks/capture-task-completion.sh` - Runs automatically on task completion
- `.claude/hooks/show-task-context.sh` - Runs automatically on task start
- `.claude/hooks/mcp-task-status.sh` - Handles MCP tool calls
- `.claude/settings.local.json` - Hook configuration

## Task History Format

```json
{
  "taskId": "1.1",
  "taskTitle": "API Client Setup",
  "completedAt": "2025-08-04T05:30:00.000Z",
  "filesEdited": [
    "src/lib/api-client.ts",
    "src/hooks/useAuth.ts"
  ],
  "implementationSummary": "Automatically captured on task completion",
  "dependencies": []
}
```

## Example Workflow

1. Start working on a task:
   ```bash
   task-master set-status --id=2 --status=in-progress
   ```
   **Automatically shows context from task 1 (dependency)**

2. Complete the task:
   ```bash
   task-master set-status --id=2 --status=done
   ```
   **Automatically captures what files were changed**

3. Next developer starts task 5:
   ```bash
   task-master set-status --id=5 --status=in-progress
   ```
   **Automatically sees your implementation from task 2**

## Note

These hooks run automatically in the background. You'll see their output in the Claude Code interface when they execute. The hooks have access to:
- Current project directory via `$CLAUDE_PROJECT_DIR`
- Tool call details via stdin
- Git repository information