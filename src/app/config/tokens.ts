// ============================================================
// DESIGN TOKENS — single source of truth for all app-specific
// colors, canvas constants, and animation values.
//
// CSS variables (theme.css) mirror these for Tailwind usage.
// JS/canvas code imports directly from here.
// ============================================================

// Skill category colors
export const CATEGORY_COLORS = {
  craft:         '#06b6d4', // cyan-500
  communication: '#ec4899', // pink-500
  leadership:    '#a855f7', // purple-500
  business:      '#3b82f6', // blue-500
} as const;

export type CategoryKey = keyof typeof CATEGORY_COLORS;

// Career level colors (level 0 = Intern … level 8 = VP/Fellow)
export const LEVEL_COLORS: Record<number, string> = {
  0: '#60A5FA', // blue-400
  1: '#34D399', // emerald-400
  2: '#A3E635', // lime-400
  3: '#FDE047', // yellow-300
  4: '#FB923C', // orange-400
  5: '#F97316', // orange-500
  6: '#EF4444', // red-500
  7: '#EC4899', // pink-500
  8: '#A855F7', // purple-500
};

// Skill node colors used by canvas / force-graph rendering
export const SKILL_NODE_COLORS = {
  locked:     '#475569', // slate-600
  target:     '#f97316', // orange-500
  know:       '#3b82f6', // blue-500
  experience: '#a855f7', // purple-500
  master:     '#eab308', // yellow-500
} as const;

// Canvas / graph rendering
export const CANVAS_BG         = '#0f172a'; // slate-950
export const CANVAS_TEXT_COLOR = '#ffffff';
export const LINK_COLOR_BASE   = 'rgba(71, 85, 105,';  // slate-600 — append opacity + ')'
export const LINK_COLOR_TARGET = 'rgba(51, 65, 85,';   // slate-700

// Particle system
export const PARTICLE_SPEED_MIN  = 0.5;
export const PARTICLE_SPEED_MAX  = 2.0;
export const PARTICLE_LIFE_MIN   = 60;
export const PARTICLE_LIFE_MAX   = 90;
export const PARTICLE_SIZE_MIN   = 2;
export const PARTICLE_SIZE_MAX   = 4;
export const PARTICLE_EMIT_COUNT = 20;

// Animation durations (seconds — for use with Motion/Framer)
export const DURATION_FAST = 0.15;
export const DURATION_BASE = 0.3;
export const DURATION_SLOW = 0.6;

// Quest log
export const DEFAULT_DEADLINE_DAYS = 30;
