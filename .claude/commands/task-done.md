Mark a task as done with implementation notes: $ARGUMENTS

Steps:
1. Parse task ID from arguments (first argument)
2. Collect implementation notes (remaining arguments)
3. Get list of files changed using `git status --porcelain`
4. Run `.claude/hooks/tm-done.sh` with task ID and notes
5. This will:
   - Mark task as done in TaskMaster
   - Record implementation history with files changed
   - Show the next available task

Example: /task-done 1.1 "Implemented API client with axios, added error handling"