export interface TimeAllocation {
  craft: number;
  communication: number;
  leadership: number;
  business: number;
}

// IC track: levels 0–6 (matching careerRoles levels)
export const IC_ALLOCATION: Record<number, TimeAllocation> = {
  0: { craft: 90, communication: 10, leadership: 0,  business: 0  },
  1: { craft: 85, communication: 10, leadership: 0,  business: 5  },
  2: { craft: 75, communication: 15, leadership: 5,  business: 5  },
  3: { craft: 65, communication: 20, leadership: 10, business: 5  },
  4: { craft: 45, communication: 25, leadership: 20, business: 10 },
  5: { craft: 35, communication: 25, leadership: 25, business: 15 },
  6: { craft: 30, communication: 25, leadership: 25, business: 20 },
};

// Management track: levels 4–7 (matching careerRoles: Manager=4, Director=5, VP=6, CDO=7)
// Levels 0–3 fall back to IC allocation (same as IC track)
export const MGMT_ALLOCATION: Record<number, TimeAllocation> = {
  0: { craft: 90, communication: 10, leadership: 0,  business: 0  },
  1: { craft: 85, communication: 10, leadership: 0,  business: 5  },
  2: { craft: 75, communication: 15, leadership: 5,  business: 5  },
  3: { craft: 65, communication: 20, leadership: 10, business: 5  },
  4: { craft: 15, communication: 35, leadership: 40, business: 10 },
  5: { craft: 10, communication: 30, leadership: 40, business: 20 },
  6: { craft: 5,  communication: 30, leadership: 40, business: 25 },
  7: { craft: 0,  communication: 30, leadership: 45, business: 25 },
};

import { CATEGORY_COLORS } from '../config/tokens';

export const CATEGORY_META: { key: keyof TimeAllocation; label: string; color: string }[] = [
  { key: 'craft',         label: 'Craft',        color: CATEGORY_COLORS.craft },
  { key: 'communication', label: 'Communication', color: CATEGORY_COLORS.communication },
  { key: 'leadership',    label: 'Leadership',    color: CATEGORY_COLORS.leadership },
  { key: 'business',      label: 'Business',      color: CATEGORY_COLORS.business },
];

export function getDefaultAllocation(level: number, track: string): TimeAllocation {
  const table = track === 'management' ? MGMT_ALLOCATION : IC_ALLOCATION;
  const maxLevel = Math.max(...Object.keys(table).map(Number));
  return table[Math.min(level, maxLevel)] ?? IC_ALLOCATION[0];
}
