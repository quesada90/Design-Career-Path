import { DEFAULT_DEADLINE_DAYS } from '../config/tokens';

/**
 * Quest Log Data Types
 * Manages SMART goals for target roles and skills
 */

export type MeasurableType = 'quantity' | 'quality';

export interface QuestTask {
  id: string;
  name: string; // Specific
  measurableType: MeasurableType;
  measurableValue: string; // number for quantity, text for quality
  deadline: string; // ISO date string (Time-bound)
  completed: boolean;
}

export interface QuestTarget {
  id: string; // roleId or skillId
  type: 'role' | 'skill';
  name: string;
  tasks: QuestTask[];
}

export type QuestTargets = Record<string, QuestTarget>;

/**
 * Generate a unique ID for tasks
 */
export function generateTaskId(): string {
  // Standard RFC4122 v4 compliant UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new task with default values
 */
export function createNewTask(): QuestTask {
  return {
    id: generateTaskId(),
    name: '',
    measurableType: 'quantity',
    measurableValue: '1',
    deadline: new Date(Date.now() + DEFAULT_DEADLINE_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false,
  };
}

/**
 * Calculate progress for a target
 */
export function calculateProgress(tasks: QuestTask[]): { completed: number; total: number; percentage: number } {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}
