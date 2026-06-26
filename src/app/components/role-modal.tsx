import { useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Circle, Target, CheckCircle2, ExternalLink, BookOpen, Briefcase, Award } from 'lucide-react';
import { getRoleState, canSetAsTarget } from '../utils/career-path-logic';
import { CATEGORY_META, getDefaultAllocation, type TimeAllocation } from '../data/time-allocation-data';
import { ModalBackdrop } from './ui/modal-backdrop';

function TimeAllocationBar({
  level,
  track,
  customTimeAllocations,
}: {
  level: number;
  track: string;
  customTimeAllocations?: Record<string, TimeAllocation>;
}) {
  const key = `${level}-${track}`;
  const alloc = customTimeAllocations?.[key] ?? getDefaultAllocation(level, track === 'single' ? 'ic' : track);

  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-3">Time Allocation</h3>

      {/* Segmented bar */}
      <div className="flex h-5 rounded-full overflow-hidden gap-px mb-3">
        {CATEGORY_META.map(({ key: k, color }) => {
          const pct = alloc[k];
          if (pct === 0) return null;
          return (
            <motion.div
              key={k}
              initial={{ flex: 0 }}
              animate={{ flex: pct }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ backgroundColor: color, minWidth: 2 }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {CATEGORY_META.map(({ key: k, label, color }) => {
          const pct = alloc[k];
          return (
            <div key={k} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-medium" style={{ color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
import { getSkillProficiencyData, type SkillProficiencyData } from '../utils/skill-mapping';
import { getAllSkillsForArchetype, type SkillProficiency } from '../data/skills-data';
import type { DesignArchetype } from './archetype-selector-modal';

// Unified skill badge component - moved outside to prevent recreation on every render
const SkillBadge = ({
  name,
  proficiencyData,
  color
}: {
  name: string;
  proficiencyData: SkillProficiencyData | null;
  color: string;
}) => {
  // No proficiency data - show grey badge without icon
  if (!proficiencyData || (!proficiencyData.currentProficiency && !proficiencyData.isTarget)) {
    return (
      <span
        className="px-3 py-1.5 bg-slate-800 text-gray-400 rounded-lg text-sm border border-slate-700 inline-flex items-center gap-2"
        style={{
          borderColor: `${color}40`,
        }}
      >
        {name}
      </span>
    );
  }

  // Has proficiency or is target - show colored badge with icon
  const getProficiencyStyle = () => {
    // Target skill (no proficiency yet)
    if (proficiencyData.isTarget && !proficiencyData.currentProficiency) {
      return {
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/50',
        icon: <Target className="w-3.5 h-3.5" />
      };
    }

    // Has proficiency
    switch (proficiencyData.currentProficiency) {
      case 'know':
        return {
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/50',
          icon: <BookOpen className="w-3.5 h-3.5" />
        };
      case 'experience':
        return {
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/50',
          icon: <Briefcase className="w-3.5 h-3.5" />
        };
      case 'master':
        return {
          color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50',
          icon: <Award className="w-3.5 h-3.5" />
        };
      default:
        return {
          color: 'text-gray-400 bg-slate-800 border-slate-700',
          icon: null
        };
    }
  };

  const style = getProficiencyStyle();

  return (
    <span
      className={`px-3 py-1.5 rounded-lg text-sm border inline-flex items-center gap-2 ${style.color}`}
    >
      {style.icon}
      {name}
    </span>
  );
};

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  title: string;
  level: number;
  track: string;
  color: string;
  description: string;
  requirements: string[];
  skills: string[];
  currentRoleId: string | null;
  targetRoleIds: string[];
  skillProficiencies: Record<string, SkillProficiency>;
  targetSkillIds: string[];
  designArchetype: DesignArchetype | null;
  onSetCurrentRole: (roleId: string) => void;
  onSetTargetRole: (roleId: string) => void;
  onClearCurrentRole: () => void;
  onClearTargetRole: (roleId: string) => void;
  onSwitchToSkillTree: () => void;
  customTimeAllocations?: Record<string, TimeAllocation>;
  readOnly?: boolean;
}

export function RoleModal({
  isOpen,
  onClose,
  roleId,
  title,
  level,
  track,
  color,
  description,
  requirements,
  skills,
  currentRoleId,
  targetRoleIds,
  skillProficiencies,
  targetSkillIds,
  designArchetype,
  onSetCurrentRole,
  onSetTargetRole,
  onClearCurrentRole,
  onClearTargetRole,
  onSwitchToSkillTree,
  customTimeAllocations,
  readOnly = false,
}: RoleModalProps) {
  const roleState = getRoleState(roleId, currentRoleId, targetRoleIds);
  const isCurrentRole = roleId === currentRoleId;
  const isTargetRole = targetRoleIds.includes(roleId);
  const canBeTarget = canSetAsTarget(roleId, currentRoleId);

  // Get all available skill IDs for the user's archetype
  const availableSkillIds = useMemo(() => {
    if (!designArchetype) return undefined;

    const allSkills = getAllSkillsForArchetype(designArchetype);
    return new Set(allSkills.map(skill => skill.id));
  }, [designArchetype]);

  // Get proficiency data for all skills - memoized to recalculate when dependencies change
  const skillsWithProficiency = useMemo(() => {
    return skills.map((skillName) => ({
      name: skillName,
      proficiency: getSkillProficiencyData(
        skillName,
        skillProficiencies,
        targetSkillIds,
        availableSkillIds
      ),
    }));
  }, [skills, skillProficiencies, targetSkillIds, availableSkillIds]);

  return (
    <ModalBackdrop isOpen={isOpen} onClose={onClose}>
          <motion.div
            className="modal-panel w-[95vw] md:w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            {/* Header */}
            <div
              className="px-6 py-5 border-b border-slate-700"
              style={{
                background: `linear-gradient(135deg, ${color}20, transparent)`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2
                    className="text-2xl md:text-3xl font-bold mb-2"
                    style={{ color }}
                  >
                    {title}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                    <span className="px-3 py-1 bg-slate-800 rounded-full">
                      Level {level}
                    </span>
                    <span className="px-3 py-1 bg-slate-800 rounded-full capitalize">
                      {track} Track
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Description */}
              <section className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Description
                </h3>
                <p className="text-gray-300 leading-relaxed">{description}</p>
              </section>

              {/* Requirements */}
              <section className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {requirements.map((req, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-2 text-gray-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>{req}</span>
                    </motion.li>
                  ))}
                </ul>
              </section>

              {/* Time Allocation */}
              <TimeAllocationBar level={level} track={track} customTimeAllocations={customTimeAllocations} />

              {/* Skills */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    Key Skills
                  </h3>
                  <button
                    onClick={() => {
                      onSwitchToSkillTree();
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>View in Skill Tree</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillsWithProficiency.map((skillData, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <SkillBadge
                        name={skillData.name}
                        proficiencyData={skillData.proficiency}
                        color={color}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Role Actions */}
              {!readOnly && (
                <section className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Your Progress
                  </h3>
                  
                  {/* Status Badge */}
                  <div className="mb-4">
                    {roleState === 'completed' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Completed Role</span>
                      </div>
                    )}
                    {roleState === 'current' && (
                      <div className="flex items-center gap-2 text-white">
                        <Circle className="w-5 h-5 fill-white" />
                        <span className="font-medium">Current Role</span>
                      </div>
                    )}
                    {roleState === 'target' && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Target className="w-5 h-5" />
                        <span className="font-medium">Target Role</span>
                      </div>
                    )}
                    {roleState === 'future' && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Circle className="w-5 h-5" />
                        <span className="font-medium">Future Role</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {/* Set/Clear Current Role */}
                    {isCurrentRole ? (
                      <button
                        onClick={onClearCurrentRole}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Clear as Current Role</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSetCurrentRole(roleId)}
                        className="btn-primary flex items-center justify-center gap-2 py-3 w-full"
                      >
                        <Circle className="w-4 h-4" />
                        <span>Set as Current Role</span>
                      </button>
                    )}

                    {/* Set/Clear Target Role */}
                    {isTargetRole ? (
                      <button
                        onClick={() => onClearTargetRole(roleId)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Clear as Target Role</span>
                      </button>
                    ) : canBeTarget ? (
                      <button
                        onClick={() => onSetTargetRole(roleId)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold rounded-lg transition-all shadow-lg cursor-pointer"
                      >
                        <Target className="w-4 h-4" />
                        <span>Set as Target Role</span>
                      </button>
                    ) : (
                      roleState !== 'completed' && roleState !== 'current' && (
                        <div className="px-4 py-3 bg-slate-800/50 text-gray-400 rounded-lg text-sm text-center border border-slate-700">
                          Set a current role first to select targets
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
    </ModalBackdrop>
  );
}