/**
 * Centralized Career Level Configuration
 * 
 * Single source of truth for:
 * - Total number of career levels
 * - Vertical positioning (margins and spacing)
 * - Level-to-position mapping
 * 
 * This ensures career path nodes and sidebar labels stay perfectly aligned.
 */

export interface CareerLevelConfig {
  totalLevels: number;  // Total number of levels (e.g., 8 means levels 0-7)
  topMargin: number;    // % from top of container for highest level
  bottomMargin: number; // % from top of container for lowest level
}

export const CAREER_CONFIG: CareerLevelConfig = {
  totalLevels: 8,    // Levels 0-7 (Intern to CDO)
  topMargin: 8,      // Top level at 8% from top
  bottomMargin: 92,  // Bottom level at 92% from top
};

/**
 * Calculate Y positions for all career levels
 * Returns a map of level -> Y position (%)
 * 
 * Example with 8 levels (0-7):
 * Level 0 (bottom) -> 92%
 * Level 7 (top) -> 8%
 * 
 * Spacing is automatically calculated to be even.
 */
export function calculateLevelPositions(config: CareerLevelConfig = CAREER_CONFIG): Record<number, number> {
  const { totalLevels, topMargin, bottomMargin } = config;
  
  // Calculate total vertical range
  const totalRange = bottomMargin - topMargin;
  
  // Calculate even spacing between levels
  const spacing = totalRange / (totalLevels - 1);
  
  // Generate positions for each level
  const positions: Record<number, number> = {};
  
  for (let level = 0; level < totalLevels; level++) {
    // Level 0 is at bottom, level (totalLevels-1) is at top
    positions[level] = bottomMargin - (spacing * level);
  }
  
  return positions;
}

/**
 * Get Y position for a specific level
 */
export function getLevelYPosition(level: number, config: CareerLevelConfig = CAREER_CONFIG): number {
  const positions = calculateLevelPositions(config);
  return positions[level] ?? 50; // Default to middle if level not found
}

/**
 * Get all level numbers in order (bottom to top)
 */
export function getAllLevels(config: CareerLevelConfig = CAREER_CONFIG): number[] {
  return Array.from({ length: config.totalLevels }, (_, i) => i);
}

/**
 * Get all level numbers in reverse order (top to bottom)
 */
export function getAllLevelsReversed(config: CareerLevelConfig = CAREER_CONFIG): number[] {
  return getAllLevels(config).reverse();
}

// Pre-calculate positions for easy import
export const levelYPositions: Record<number, number> = calculateLevelPositions(CAREER_CONFIG);

/**
 * Level mapping reference:
 * 
 * Level 0: Intern
 * Level 1: Junior Designer
 * Level 2: Mid-level Designer
 * Level 3: Senior Designer
 * Level 4: Staff Designer / Design Manager
 * Level 5: Principal Designer / Design Director
 * Level 6: Distinguished Designer / VP of Design
 * Level 7: Chief Design Officer
 */