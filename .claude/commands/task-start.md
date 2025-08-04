Start a task and show context from dependencies: $ARGUMENTS

Steps:
1. Run `.claude/hooks/tm-start.sh` with the task ID
2. This will:
   - Show implementation history from dependent tasks
   - Display files that were edited in dependencies
   - Mark the task as in-progress
   - Show full task details
3. Begin implementation with full context

Example: /task-start 2