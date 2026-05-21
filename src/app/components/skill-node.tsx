import { motion } from 'motion/react';
import { Lock, Unlock, BookOpen, Briefcase, Award, Target } from 'lucide-react';
import { useState, useRef } from 'react';
import { SkillTooltipPortal } from './skill-tooltip-portal';
import type { Skill, SkillProficiency } from '../data/skills-data';

interface SkillNodeProps {
  skill: Skill;
  proficiency: SkillProficiency;
  isUnlocked: boolean;
  isTarget: boolean;
  onClick: () => void;
  color: string; // Role color for highlights
}

export function SkillNode({ skill, proficiency, isUnlocked, isTarget, onClick, color }: SkillNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get icon based on proficiency or target state
  const getProficiencyIcon = () => {
    // Show target icon for target skills
    if (isTarget && isUnlocked && proficiency === 'locked') {
      return <Target className="w-4 h-4" />;
    }
    
    // Show unlock icon for unlocked skills with no proficiency (and not targeted)
    if (isUnlocked && proficiency === 'locked' && !isTarget) {
      return <Unlock className="w-4 h-4" />;
    }
    
    switch (proficiency) {
      case 'locked':
        return <Lock className="w-4 h-4" />;
      case 'know':
        return <BookOpen className="w-4 h-4" />;
      case 'experience':
        return <Briefcase className="w-4 h-4" />;
      case 'master':
        return <Award className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Get colors based on proficiency or target state
  const getColors = () => {
    if (!isUnlocked) {
      return {
        border: 'border-slate-700',
        borderStyle: 'border-solid',
        bg: 'bg-slate-800/30',
        text: 'text-gray-600',
        icon: 'text-gray-600',
      };
    }

    // Target skills (unlocked but no proficiency)
    if (isTarget && proficiency === 'locked') {
      return {
        border: 'border-orange-500',
        borderStyle: 'border-dashed',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        icon: 'text-orange-400',
      };
    }

    // Unlocked but no proficiency (and not targeted) - show as available
    if (isUnlocked && proficiency === 'locked' && !isTarget) {
      return {
        border: 'border-cyan-500/40',
        borderStyle: 'border-solid',
        bg: 'bg-cyan-500/5',
        text: 'text-cyan-400',
        icon: 'text-cyan-400',
      };
    }

    switch (proficiency) {
      case 'know':
        return {
          border: 'border-blue-500/50',
          borderStyle: 'border-solid',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          icon: 'text-blue-400',
        };
      case 'experience':
        return {
          border: 'border-purple-500/50',
          borderStyle: 'border-solid',
          bg: 'bg-purple-500/10',
          text: 'text-purple-400',
          icon: 'text-purple-400',
        };
      case 'master':
        return {
          border: 'border-yellow-500/50',
          borderStyle: 'border-solid',
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-400',
          icon: 'text-yellow-400',
        };
      default:
        return {
          border: 'border-slate-600',
          borderStyle: 'border-solid',
          bg: 'bg-slate-800/50',
          text: 'text-gray-400',
          icon: 'text-gray-400',
        };
    }
  };

  const colors = getColors();
  const isLocked = !isUnlocked;

  return (
    <div
      className="absolute"
      style={{
        left: `${skill.x}%`,
        top: `${skill.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        ref={buttonRef}
        onClick={onClick}
        disabled={isLocked}
        className={`relative ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        whileHover={!isLocked ? { scale: 1.1 } : {}}
        whileTap={!isLocked ? { scale: 0.95 } : {}}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Skill Square */}
        <div
          className={`w-12 h-12 rounded-lg border-2 ${colors.borderStyle} ${colors.border} ${colors.bg} backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
            !isLocked && 'hover:shadow-lg hover:shadow-cyan-500/20'
          }`}
        >
          <div className={colors.icon}>{getProficiencyIcon()}</div>
        </div>

        {/* Skill Label */}
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[120px]">
          <p className={`text-xs text-center ${colors.text} font-medium leading-tight`}>
            {skill.name}
          </p>
        </div>

        {/* Proficiency Badge (for non-locked skills with proficiency) */}
        {!isLocked && proficiency !== 'locked' && (
          <motion.div
            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${
              proficiency === 'know'
                ? 'bg-blue-500'
                : proficiency === 'experience'
                ? 'bg-purple-500'
                : 'bg-yellow-500'
            } flex items-center justify-center`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-[10px] text-white font-bold">
              {proficiency === 'know' ? '1' : proficiency === 'experience' ? '2' : '3'}
            </span>
          </motion.div>
        )}
      </motion.button>

      {/* Portal for Tooltip */}
      <SkillTooltipPortal
        skill={skill}
        proficiency={proficiency}
        isUnlocked={isUnlocked}
        isTarget={isTarget}
        isVisible={isHovered}
        triggerRef={buttonRef.current}
      />
    </div>
  );
}