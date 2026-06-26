import { SKILL_NODE_COLORS, CATEGORY_COLORS } from '../config/tokens';
import type { SkillProficiency } from '../data/skills-data';

interface SkillColorSet {
  bg: string;
  border: string;
  text: string;
  glow: string;
}

/**
 * Returns a consistent color set for a given skill proficiency state.
 * Used by skill-node.tsx, skill-modal.tsx, and skill-force-graph.tsx
 * to keep proficiency colors in sync across the UI.
 */
export function useSkillNodeColors() {
  const getColors = (
    proficiency: SkillProficiency | 'locked',
    isTarget = false,
    isUnlocked = true,
  ): SkillColorSet => {
    if (!isUnlocked) {
      return {
        bg:     'bg-slate-800/50',
        border: 'border-slate-700',
        text:   'text-slate-500',
        glow:   SKILL_NODE_COLORS.locked,
      };
    }
    if (isTarget && proficiency === 'locked') {
      return {
        bg:     'bg-orange-500/10',
        border: 'border-orange-500/60',
        text:   'text-orange-400',
        glow:   SKILL_NODE_COLORS.target,
      };
    }
    switch (proficiency) {
      case 'master':
        return {
          bg:     'bg-yellow-500/10',
          border: 'border-yellow-500/60',
          text:   'text-yellow-400',
          glow:   SKILL_NODE_COLORS.master,
        };
      case 'experience':
        return {
          bg:     'bg-purple-500/10',
          border: 'border-purple-500/60',
          text:   'text-purple-400',
          glow:   SKILL_NODE_COLORS.experience,
        };
      case 'know':
        return {
          bg:     'bg-blue-500/10',
          border: 'border-blue-500/60',
          text:   'text-blue-400',
          glow:   SKILL_NODE_COLORS.know,
        };
      default:
        return {
          bg:     'bg-slate-700/30',
          border: 'border-slate-600',
          text:   'text-slate-300',
          glow:   CATEGORY_COLORS.craft,
        };
    }
  };

  return { getColors };
}
