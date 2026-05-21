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
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
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
