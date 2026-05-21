import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, Plus, Trash2, Target, Sparkles, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { QuestTarget, QuestTask, MeasurableType } from '../types/quest-log';
import { calculateProgress } from '../types/quest-log';

interface QuestLogProps {
  targets: QuestTarget[];
  onAddTask: (targetId: string) => void;
  onDeleteTask: (targetId: string, taskId: string) => void;
  onToggleTask: (targetId: string, taskId: string) => void;
  onUpdateTask: (targetId: string, taskId: string, field: keyof QuestTask, value: string | boolean) => void;
}

export function QuestLog({
  targets,
  onAddTask,
  onDeleteTask,
  onToggleTask,
  onUpdateTask,
}: QuestLogProps) {
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set());

  const toggleExpanded = (targetId: string) => {
    const newExpanded = new Set(expandedTargets);
    if (newExpanded.has(targetId)) {
      newExpanded.delete(targetId);
    } else {
      newExpanded.add(targetId);
    }
    setExpandedTargets(newExpanded);
  };

  if (targets.length === 0) {
    return (
      <div className="relative w-full py-12 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-12"
          >
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">No Active Quests</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Set target roles in Career Path and target skills in Skill Tree to start tracking your progress.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full py-6 md:py-12">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            Quest Log
          </h1>
          <p className="text-gray-400">Track SMART goals for your target roles and skills</p>
        </motion.div>

        <div className="space-y-4">
          {targets.map((target, index) => {
            const isExpanded = expandedTargets.has(target.id);
            const progress = calculateProgress(target.tasks);
            const isRole = target.type === 'role';

            return (
              <motion.div
                key={target.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden"
              >
                {/* Target Header - Clickable */}
                <button
                  onClick={() => toggleExpanded(target.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors text-left"
                >
                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>

                  {/* Target Icon */}
                  {isRole ? (
                    <Target className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                  )}

                  {/* Target Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">
                      {target.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isRole ? 'Target Role' : 'Target Skill'}
                    </p>
                  </div>

                  {/* Progress Badge */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-gray-400">
                      {progress.completed}/{progress.total} tasks
                    </span>
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </button>

                {/* Tasks List - Expandable */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-800"
                    >
                      <div className="p-6 space-y-4">
                        {/* Task List */}
                        {target.tasks.map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onToggle={() => onToggleTask(target.id, task.id)}
                            onUpdate={(field, value) => onUpdateTask(target.id, task.id, field, value)}
                            onDelete={() => onDeleteTask(target.id, task.id)}
                          />
                        ))}

                        {/* Add Task Button */}
                        <button
                          onClick={() => onAddTask(target.id)}
                          className="w-full py-3 px-4 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-lg text-gray-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 group"
                        >
                          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">Add Task</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Task Row Component
interface TaskRowProps {
  task: QuestTask;
  onToggle: () => void;
  onUpdate: (field: keyof QuestTask, value: string | boolean) => void;
  onDelete: () => void;
}

function TaskRow({ task, onToggle, onUpdate, onDelete }: TaskRowProps) {
  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="mt-1 flex-shrink-0"
        >
          <div
            className={`w-5 h-5 rounded border-2 transition-all ${
              task.completed
                ? 'bg-cyan-500 border-cyan-500'
                : 'border-slate-600 hover:border-cyan-500'
            } flex items-center justify-center`}
          >
            {task.completed && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </div>
        </button>

        {/* Task Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Task Name (Specific) */}
          <div className="md:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Task Name</label>
            <input
              type="text"
              value={task.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              placeholder="e.g., Lead design project"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
              disabled={task.completed}
            />
          </div>

          {/* Measurable Type & Value */}
          <div className="md:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Measurable</label>
            <div className="flex gap-2">
              <select
                value={task.measurableType}
                onChange={(e) => onUpdate('measurableType', e.target.value as MeasurableType)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                disabled={task.completed}
              >
                <option value="quantity">Qty</option>
                <option value="quality">Qlty</option>
              </select>
              {task.measurableType === 'quantity' ? (
                <input
                  type="number"
                  min="1"
                  value={task.measurableValue}
                  onChange={(e) => onUpdate('measurableValue', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  disabled={task.completed}
                />
              ) : (
                <input
                  type="text"
                  value={task.measurableValue}
                  onChange={(e) => onUpdate('measurableValue', e.target.value)}
                  placeholder="Description"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
                  disabled={task.completed}
                />
              )}
            </div>
          </div>

          {/* Achievable (auto-calculated when completed) */}
          <div className="md:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Achievable</label>
            <div className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm h-10 flex items-center">
              {task.completed ? (
                <span className="text-green-400">✓ Achieved</span>
              ) : (
                <span className="text-gray-600">In Progress</span>
              )}
            </div>
          </div>

          {/* Deadline (Time-bound) */}
          <div className="md:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">Deadline</label>
            <input
              type="date"
              value={task.deadline}
              onChange={(e) => onUpdate('deadline', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              disabled={task.completed}
            />
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="mt-6 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
