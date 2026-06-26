import type { ComponentType } from 'react';
import { motion } from 'motion/react';
import { X, Lock, BookOpen, Briefcase, Award, Target } from 'lucide-react';
import type { Skill, SkillProficiency } from '../data/skills-data';
import { ModalBackdrop } from './ui/modal-backdrop';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill;
  currentProficiency: SkillProficiency;
  onProficiencyChange: (skillId: string, proficiency: SkillProficiency) => void;
  isUnlocked: boolean;
  targetSkillIds: string[];
  onToggleTarget: (skillId: string) => void;
  readOnly?: boolean;
}

const proficiencyLevels: { value: SkillProficiency; label: string; icon: ComponentType<{ className?: string }>; color: string; description: string }[] = [
  {
    value: 'know',
    label: 'Know',
    icon: BookOpen,
    color: 'from-blue-600 to-blue-500',
    description: 'Basic understanding of concepts and principles',
  },
  {
    value: 'experience',
    label: 'Experience',
    icon: Briefcase,
    color: 'from-purple-600 to-purple-500',
    description: 'Practical application in real projects',
  },
  {
    value: 'master',
    label: 'Master',
    icon: Award,
    color: 'from-yellow-600 to-yellow-500',
    description: 'Expert level with deep knowledge and consistent results',
  },
];

export function SkillModal({
  isOpen,
  onClose,
  skill,
  currentProficiency,
  onProficiencyChange,
  isUnlocked,
  targetSkillIds,
  onToggleTarget,
  readOnly = false,
}: SkillModalProps) {
  const handleProficiencySelect = (proficiency: SkillProficiency) => {
    if (!isUnlocked || readOnly) return;
    
    // Toggle: if clicking the same proficiency, deselect it (set back to 'locked')
    if (currentProficiency === proficiency) {
      onProficiencyChange(skill.id, 'locked');
    } else {
      onProficiencyChange(skill.id, proficiency);
    }
  };

  const isTargeted = targetSkillIds.includes(skill.id);

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
            <motion.div
              className="modal-panel max-w-2xl w-full"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              {/* Header */}
              <div className="relative px-8 py-6 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-white mb-2 pr-8">{skill.name}</h2>
                <p className="text-gray-400 text-sm">{skill.description}</p>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 transition-all duration-300 group cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                </button>

                {/* Locked Badge */}
                {!isUnlocked && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <Lock className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-medium">
                      Unlocks at level {skill.unlockAtLevel}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Target Button - At the top, only show if unlocked, no proficiency set, and not readOnly */}
                {isUnlocked && currentProficiency === 'locked' && !readOnly && (
                  <div className="mb-6">
                    <motion.button
                      onClick={() => onToggleTarget(skill.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer ${
                        isTargeted
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${isTargeted ? 'from-orange-600 to-orange-500' : 'from-slate-700 to-slate-600'} flex items-center justify-center flex-shrink-0`}
                        >
                          <Target className="w-6 h-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-white">
                              {isTargeted ? 'Remove as Target' : 'Set as Target'}
                            </h4>
                            {isTargeted && (
                              <motion.div
                                className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {isTargeted
                              ? 'This skill is marked as a learning target'
                              : 'Mark this skill as something you want to learn next'}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-white mb-4">
                  {readOnly ? 'Designer Proficiency Level' : isUnlocked ? 'Set Your Proficiency Level' : 'Proficiency Levels'}
                </h3>

                {/* Proficiency Options */}
                <div className="space-y-3">
                  {proficiencyLevels.map((level) => {
                    const Icon = level.icon;
                    const isSelected = currentProficiency === level.value;
                    const isDisabled = !isUnlocked || readOnly;

                    return (
                      <motion.button
                        key={level.value}
                        onClick={() => handleProficiencySelect(level.value)}
                        disabled={isDisabled}
                        type="button"
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                          isDisabled && !isSelected
                            ? 'border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        whileHover={!isDisabled ? { scale: 1.02 } : {}}
                        whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-bold text-white">{level.label}</h4>
                              {isSelected && (
                                <motion.div
                                  className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </motion.div>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {isSelected && !readOnly ? 'Click again to deselect' : level.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-2">Skill Details</h4>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center justify-between">
                      <span>Category:</span>
                      <span className="text-cyan-400 font-medium capitalize">{skill.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Required Level:</span>
                      <span className="text-cyan-400 font-medium">Level {skill.unlockAtLevel}</span>
                    </div>
                    {skill.connections.length > 0 && (
                      <div className="flex items-start justify-between">
                        <span>Related Skills:</span>
                        <span className="text-cyan-400 font-medium text-right">
                          {skill.connections.length} connected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={onClose}
                  className="btn-primary px-6 py-2"
                >
                  Done
                </button>
              </div>
            </motion.div>
    </ModalBackdrop>
  );
}