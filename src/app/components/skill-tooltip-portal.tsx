import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock } from 'lucide-react';
import type { Skill, SkillProficiency } from '../data/skills-data';

interface SkillTooltipPortalProps {
  skill: Skill;
  proficiency: SkillProficiency;
  isUnlocked: boolean;
  isTarget: boolean;
  isVisible: boolean;
  triggerRef: HTMLElement | null;
}

export function SkillTooltipPortal({
  skill,
  proficiency,
  isUnlocked,
  isTarget,
  isVisible,
  triggerRef,
}: SkillTooltipPortalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0, placement: 'top' as 'top' | 'bottom' });

  useEffect(() => {
    if (!triggerRef || !isVisible) return;

    const updatePosition = () => {
      const rect = triggerRef.getBoundingClientRect();
      const tooltipWidth = 192; // w-48 = 192px
      const tooltipHeight = 120; // approximate height
      const gap = 12; // gap between node and tooltip

      // Calculate horizontal center
      const x = rect.left + rect.width / 2;

      // Determine if tooltip should be above or below
      // If in top 40% of viewport, show below
      const viewportHeight = window.innerHeight;
      const skillCenterY = rect.top + rect.height / 2;
      const isInTopHalf = skillCenterY < viewportHeight * 0.4;

      let y: number;
      let placement: 'top' | 'bottom';

      if (isInTopHalf) {
        // Show below the skill (below the label)
        y = rect.bottom + 40; // Account for label height
        placement = 'bottom';
      } else {
        // Show above the skill
        y = rect.top - gap;
        placement = 'top';
      }

      setPosition({ x, y, placement });
    };

    updatePosition();

    // Update on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [triggerRef, isVisible]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: position.x,
            [position.placement === 'top' ? 'bottom' : 'top']: 
              position.placement === 'top' 
                ? `${window.innerHeight - position.y}px` 
                : `${position.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className={`${
            isUnlocked 
              ? 'bg-slate-800 border-cyan-500/30' 
              : 'bg-slate-800 border-slate-600/30'
          } border rounded-lg p-3 shadow-xl w-48`}>
            <p className="text-xs text-white font-semibold mb-1">{skill.name}</p>
            <p className={`text-xs leading-relaxed mb-2 ${
              isUnlocked ? 'text-gray-300' : 'text-gray-400'
            }`}>{skill.description}</p>
            
            {isUnlocked && proficiency !== 'locked' && !isTarget && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-cyan-400 font-medium capitalize">
                  {proficiency === 'know' && '📖 Know'}
                  {proficiency === 'experience' && '💼 Experience'}
                  {proficiency === 'master' && '🏆 Master'}
                </p>
              </div>
            )}

            {isTarget && isUnlocked && proficiency === 'locked' && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-orange-400 font-medium">
                  🎯 Target Skill
                </p>
              </div>
            )}

            {!isUnlocked && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <div className="flex items-center gap-1.5 text-red-400">
                  <Lock className="w-3 h-3" />
                  <p className="text-xs font-medium">Unlocks at level {skill.unlockAtLevel}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}