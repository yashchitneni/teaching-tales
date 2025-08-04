#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Task start hook - provides context from dependent tasks
async function onTaskStart(taskId) {
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
    
    console.log(`\n🚀 Starting Task ${taskId}: ${task.title}`);
    console.log('━'.repeat(60));
    
    // If task has dependencies, show their implementation history
    if (task.dependencies && task.dependencies.length > 0) {
      console.log('\n📋 Context from dependent tasks:');
      
      // Read history
      if (fs.existsSync(historyPath)) {
        const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
        
        for (const depId of task.dependencies) {
          const depHistory = history.history.find(h => h.taskId.toString() === depId.toString());
          
          if (depHistory) {
            console.log(`\n📌 Task ${depId}: ${depHistory.taskTitle}`);
            console.log(`   Completed: ${new Date(depHistory.completedAt).toLocaleDateString()}`);
            
            if (depHistory.filesEdited && depHistory.filesEdited.length > 0) {
              console.log(`   Files edited:`);
              depHistory.filesEdited.forEach(file => {
                console.log(`     - ${file}`);
              });
            }
            
            if (depHistory.implementationSummary) {
              console.log(`   Implementation notes:`);
              console.log(`     ${depHistory.implementationSummary}`);
            }
            
            if (depHistory.subtasksCompleted && depHistory.subtasksCompleted.length > 0) {
              console.log(`   Subtasks completed: ${depHistory.subtasksCompleted.length}`);
            }
          } else {
            console.log(`\n⚠️  Task ${depId}: No history found (may not be completed yet)`);
          }
        }
      } else {
        console.log('\n⚠️  No task history found yet');
      }
    }
    
    // Show task details
    console.log('\n📝 Current task details:');
    console.log(`Description: ${task.description}`);
    if (task.details) {
      console.log(`\nImplementation details:\n${task.details}`);
    }
    if (task.testStrategy) {
      console.log(`\nTest strategy:\n${task.testStrategy}`);
    }
    
    // Show subtasks if any
    if (task.subtasks && task.subtasks.length > 0) {
      console.log(`\n📊 Subtasks (${task.subtasks.length}):`);
      task.subtasks.forEach(st => {
        const status = st.status === 'done' ? '✅' : '⭕';
        console.log(`   ${status} ${taskId}.${st.id}: ${st.title}`);
      });
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('💡 Use TASK_IMPLEMENTATION_NOTES env var when marking task done');
    console.log('   to record what was implemented\n');
    
  } catch (error) {
    console.error('Error loading task context:', error);
  }
}

// Helper function to find task by ID
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
    console.error('Usage: task-start.js <taskId>');
    process.exit(1);
  }
  onTaskStart(taskId);
}

module.exports = { onTaskStart };