#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Task completion hook - captures implementation details when a task is marked done
async function onTaskComplete(taskId) {
  try {
    const projectRoot = process.cwd();
    const historyPath = path.join(projectRoot, '.taskmaster', 'task_history.json');
    const tasksPath = path.join(projectRoot, '.taskmaster', 'tasks', 'tasks.json');
    
    // Read current task details
    const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    const task = findTaskById(tasksData.master.tasks, taskId);
    
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }
    
    // Get git diff for files changed since task started
    let filesChanged = [];
    try {
      const gitStatus = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
      filesChanged = gitStatus.trim().split('\n').filter(f => f);
    } catch (e) {
      // If no commits, get unstaged changes
      try {
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
        filesChanged = gitStatus.trim().split('\n')
          .map(line => line.substring(3))
          .filter(f => f);
      } catch (e2) {
        console.log('Could not get git changes');
      }
    }
    
    // Read implementation notes from environment or prompt
    const implementationNotes = process.env.TASK_IMPLEMENTATION_NOTES || '';
    
    // Create history entry
    const historyEntry = {
      taskId: taskId,
      taskTitle: task.title,
      completedAt: new Date().toISOString(),
      filesEdited: filesChanged,
      implementationSummary: implementationNotes,
      subtasksCompleted: task.subtasks ? task.subtasks.filter(st => st.status === 'done').map(st => ({
        id: `${taskId}.${st.id}`,
        title: st.title,
        details: st.details
      })) : [],
      dependencies: task.dependencies || [],
      testStrategy: task.testStrategy || ''
    };
    
    // Read existing history
    let history = { history: [], metadata: {} };
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    }
    
    // Add new entry
    history.history.push(historyEntry);
    
    // Write updated history
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    
    console.log(`✅ Task ${taskId} completion recorded in history`);
    console.log(`📝 Files edited: ${filesChanged.length}`);
    
  } catch (error) {
    console.error('Error recording task completion:', error);
  }
}

// Helper function to find task by ID (supports nested subtasks)
function findTaskById(tasks, targetId) {
  for (const task of tasks) {
    if (task.id.toString() === targetId.toString()) {
      return task;
    }
    if (task.subtasks) {
      const subtask = task.subtasks.find(st => 
        `${task.id}.${st.id}` === targetId.toString()
      );
      if (subtask) {
        return { ...subtask, parentId: task.id };
      }
    }
  }
  return null;
}

// Execute if called directly
if (require.main === module) {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error('Usage: task-complete.js <taskId>');
    process.exit(1);
  }
  onTaskComplete(taskId);
}

module.exports = { onTaskComplete };