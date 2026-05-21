/**
 * Skill Mapping System
 * Maps Career Path "Key Skills" to Skill Tree skill IDs
 *
 * This allows us to connect career progression with skill proficiency tracking
 */

/**
 * Maps career path skill names to Skill Tree skill IDs
 * This enables us to show proficiency levels for career path skills
 */
export const careerSkillToSkillTreeMap: Record<string, string> = {
  // ============================================
  // INTERN LEVEL (0)
  // ============================================
  'Basic Design Tools': 'craft-pd-figma', // Design tool proficiency
  'Visual Design': 'craft-vd-color', // Visual design fundamentals
  'Communication': 'leadership-communication',
  'Collaboration': 'leadership-collaboration',
  'Time Management': 'leadership-time-management', // NEW - needs to be added

  // ============================================
  // JUNIOR DESIGNER (1)
  // ============================================
  'UI Design': 'craft-pd-ui-design',
  'Prototyping': 'craft-pd-prototyping',
  'User Research Basics': 'craft-ux-qual-research', // Qualitative research
  'Design Systems': 'craft-pd-design-systems',
  'Stakeholder Communication': 'leadership-stakeholder',

  // ============================================
  // MID-LEVEL DESIGNER (2)
  // ============================================
  'Interaction Design': 'craft-pd-interaction',
  'User Research': 'craft-ux-qual-research',
  'Usability Testing': 'craft-pd-usability',
  'Design Critique': 'leadership-feedback', // Giving feedback
  'Cross-functional Collaboration': 'leadership-collaboration',

  // ============================================
  // SENIOR DESIGNER (3)
  // ============================================
  'Strategic Design': 'business-strategy',
  'Leadership': 'leadership-mentoring',
  'Stakeholder Management': 'leadership-stakeholder',
  'Data-Driven Design': 'craft-pd-data-informed',

  // ============================================
  // STAFF DESIGNER (4 - IC)
  // ============================================
  'Deep Craft Expertise': 'leadership-craft-expertise', // NEW - needs to be added
  'Design Systems Architecture': 'craft-ds-library',
  'Advanced Prototyping': 'craft-id-frontend', // Front-end prototyping
  'Technical Design': 'craft-id-frontend',
  'Design QA': 'craft-ds-testing',

  // ============================================
  // PRINCIPAL DESIGNER (5 - IC)
  // ============================================
  'Design Innovation': 'leadership-innovation', // NEW - needs to be added
  'Systems Thinking': 'craft-sd-systems',
  'Technical Architecture': 'craft-ds-library',
  'Thought Leadership': 'leadership-thought-leadership', // NEW - needs to be added
  'Community Building': 'leadership-community-building', // NEW - needs to be added

  // ============================================
  // DISTINGUISHED DESIGNER (6 - IC)
  // ============================================
  'Strategic Vision': 'business-vision',
  'Industry Influence': 'leadership-industry-influence', // NEW - needs to be added
  'Innovation Leadership': 'leadership-innovation', // NEW - needs to be added
  'Executive Advisory': 'business-exec-advisory', // NEW - needs to be added
  'Legacy Building': 'leadership-legacy-building', // NEW - needs to be added

  // ============================================
  // DESIGN MANAGER (4 - Management)
  // ============================================
  'People Management': 'leadership-people-mgmt', // NEW - needs to be added
  'Team Coordination': 'leadership-team-building',
  '1:1 Coaching': 'leadership-mentoring',
  'Performance Support': 'leadership-performance-mgmt', // NEW - needs to be added
  'Hiring & Recruiting': 'leadership-hiring', // NEW - needs to be added

  // ============================================
  // DESIGN DIRECTOR (5 - Management)
  // ============================================
  'Manager Development': 'leadership-manager-dev', // NEW - needs to be added
  'Org Design': 'leadership-org-design', // NEW - needs to be added
  'Strategic Planning': 'business-strategy',
  'Process Improvement': 'leadership-process-improvement', // NEW - needs to be added
  'Cross-org Leadership': 'leadership-cross-org', // NEW - needs to be added

  // ============================================
  // VP OF DESIGN (6 - Management)
  // ============================================
  'Executive Leadership': 'leadership-exec-leadership', // NEW - needs to be added
  'Business Strategy': 'business-strategy',
  'P&L Ownership': 'business-pnl', // NEW - needs to be added
  'Org Transformation': 'leadership-org-transformation', // NEW - needs to be added
  'C-suite Collaboration': 'leadership-c-suite', // NEW - needs to be added

  // ============================================
  // CHIEF DESIGN OFFICER (7 - Management)
  // ============================================
  'Executive Strategy': 'business-exec-strategy', // NEW - needs to be added
  'C-suite Influence': 'leadership-c-suite', // NEW - needs to be added
  'Organizational Leadership': 'leadership-org-leadership', // NEW - needs to be added
  'P&L Management': 'business-pnl', // NEW - needs to be added
  'Board Communication': 'leadership-board-comm', // NEW - needs to be added
};

/**
 * Get Skill Tree ID from Career Path skill name
 */
export function getSkillTreeId(careerSkillName: string): string | undefined {
  return careerSkillToSkillTreeMap[careerSkillName];
}

/**
 * Check if a career skill is mapped to the skill tree
 */
export function isSkillMapped(careerSkillName: string): boolean {
  return careerSkillName in careerSkillToSkillTreeMap;
}

/**
 * Get proficiency data for a career skill
 */
export interface SkillProficiencyData {
  skillId: string;
  currentProficiency: 'locked' | 'know' | 'experience' | 'master' | null;
  isTarget: boolean;
}

/**
 * Check if a skill ID exists in the available skills for a given archetype
 */
function isSkillAvailableForArchetype(
  skillId: string,
  availableSkillIds: Set<string>
): boolean {
  return availableSkillIds.has(skillId);
}

export function getSkillProficiencyData(
  careerSkillName: string,
  skillProficiencies: Record<string, 'locked' | 'know' | 'experience' | 'master'>,
  targetSkillIds: string[],
  availableSkillIds?: Set<string>
): SkillProficiencyData | null {
  const skillId = getSkillTreeId(careerSkillName);

  // Skill not mapped at all
  if (!skillId) {
    return null;
  }

  // If archetype filtering is enabled, check if skill exists for user's archetype
  if (availableSkillIds && !isSkillAvailableForArchetype(skillId, availableSkillIds)) {
    return null; // Skill doesn't exist for this archetype - show grey badge
  }

  return {
    skillId,
    currentProficiency: skillProficiencies[skillId] || null,
    isTarget: targetSkillIds.includes(skillId),
  };
}
