/**
 * @typedef {'todo' | 'in-progress' | 'review' | 'done'} TaskStatus
 * @typedef {'low' | 'medium' | 'high' | 'critical'} Priority
 */

export const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const STATUS_LABELS = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'Review',
  'done': 'Done',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};
