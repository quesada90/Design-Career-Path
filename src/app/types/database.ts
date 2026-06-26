import type { SkillProficiency } from '../data/skills-data';
import type { MeasurableType } from './quest-log';

// Mirrors the `profiles` table schema
export interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  archetype: string | null;
  current_role_id: string | null;
  target_role_ids: string[];
  custom_time_allocations: Record<string, unknown>;
  excluded_skill_ids: string[];
  created_at: string;
  updated_at: string;
}

// Mirrors the `skill_proficiencies` table schema
export interface DbSkillProficiency {
  id: string;
  profile_id: string;
  skill_id: string;
  proficiency_level: SkillProficiency;
  created_at: string;
  updated_at: string;
}

// Mirrors the `target_skills` table schema
export interface DbTargetSkill {
  id: string;
  profile_id: string;
  skill_id: string;
  created_at: string;
}

// Mirrors the `quest_tasks` table schema
export interface DbQuestTask {
  id: string;
  profile_id: string;
  target_id: string;
  target_type: 'role' | 'skill';
  name: string;
  measurable_type: MeasurableType;
  measurable_value: string;
  deadline: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Mirrors the `shared_links` table schema
export interface DbSharedLink {
  id: string;
  profile_id: string;
  token: string;
  label: string | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}
