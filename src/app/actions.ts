'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { revalidatePath } from 'next/cache';
import type { QuestTask } from './types/quest-log';

// Helper to secure user routes and retrieve active Clerk ID
async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized access. User must be logged in.');
  }
  return userId;
}

// ==========================================
// 1. PROFILES ACTIONS
// ==========================================

export async function fetchProfile() {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is PostgreSQL code for zero rows returned (not an error for a brand new user)
    console.error('Error fetching profile:', error);
    throw new Error('Failed to fetch profile data.');
  }

  // If new user has no profile, auto-initialize it using Clerk email and metadata
  if (!data) {
    const user = await currentUser();
    if (!user) throw new Error('Clerk user session not found.');

    const email = user.emailAddresses[0]?.emailAddress || '';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    const { data: newProfile, error: initError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        avatar_url: user.imageUrl || '',
      })
      .select()
      .single();

    if (initError) {
      console.error('Error initializing user profile:', initError);
      throw new Error('Failed to create designer profile.');
    }

    return newProfile;
  }

  return data;
}

interface UpdateProfileInput {
  archetype?: string | null;
  current_role_id?: string | null;
  target_role_ids?: string[];
  custom_time_allocations?: Record<string, number>;
  excluded_skill_ids?: string[];
}

export async function updateProfile(input: UpdateProfileInput) {
  const userId = await requireAuth();

  const { error } = await supabase
    .from('profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile changes.');
  }

  revalidatePath('/');
}

// ==========================================
// 2. SKILL PROFICIENCIES ACTIONS
// ==========================================

export async function fetchSkillProficiencies() {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('skill_proficiencies')
    .select('skill_id, proficiency_level')
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching skill proficiencies:', error);
    throw new Error('Failed to fetch skill competencies.');
  }

  // Convert array back into local record shape: Record<skillId, proficiencyLevel>
  const proficiencies: Record<string, 'locked' | 'know' | 'experience' | 'master'> = {};
  data.forEach((p) => {
    proficiencies[p.skill_id] = p.proficiency_level as any;
  });

  return proficiencies;
}

export async function saveSkillProficiency(skillId: string, level: 'locked' | 'know' | 'experience' | 'master') {
  const userId = await requireAuth();

  if (level === 'locked') {
    // Delete record if level set back to locked to keep database slim
    const { error } = await supabase
      .from('skill_proficiencies')
      .delete()
      .eq('profile_id', userId)
      .eq('skill_id', skillId);

    if (error) {
      console.error('Error clearing skill proficiency:', error);
      throw new Error('Failed to reset skill level.');
    }
  } else {
    // Upsert level (insert or update on conflict)
    const { error } = await supabase.from('skill_proficiencies').upsert({
      profile_id: userId,
      skill_id: skillId,
      proficiency_level: level,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,skill_id'
    });

    if (error) {
      console.error('Error saving skill proficiency:', error);
      throw new Error('Failed to save skill proficiency.');
    }
  }

  revalidatePath('/');
}

// ==========================================
// 3. TARGET SKILLS ACTIONS
// ==========================================

export async function fetchTargetSkills() {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('target_skills')
    .select('skill_id')
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching target skills:', error);
    throw new Error('Failed to retrieve target skills.');
  }

  return data.map((t) => t.skill_id);
}

export async function toggleTargetSkill(skillId: string) {
  const userId = await requireAuth();

  // Check if target skill exists
  const { data, error: checkError } = await supabase
    .from('target_skills')
    .select('id')
    .eq('profile_id', userId)
    .eq('skill_id', skillId)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking target skill status:', checkError);
    throw new Error('Database transaction check failed.');
  }

  if (data) {
    // Remove if already exists
    const { error: deleteError } = await supabase
      .from('target_skills')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.error('Error removing target skill:', deleteError);
      throw new Error('Failed to remove skill target.');
    }
  } else {
    // Insert if it does not exist
    const { error: insertError } = await supabase.from('target_skills').insert({
      profile_id: userId,
      skill_id: skillId,
    });

    if (insertError) {
      console.error('Error adding target skill:', insertError);
      throw new Error('Failed to add skill target.');
    }
  }

  revalidatePath('/');
}

// ==========================================
// 4. QUEST TASKS ACTIONS
// ==========================================

export async function fetchQuestTasks() {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('quest_tasks')
    .select('*')
    .eq('profile_id', userId);

  if (error) {
    console.error('Error fetching quest tasks:', error);
    throw new Error('Failed to fetch Quest checklist.');
  }

  return data;
}

export async function saveQuestTask(task: Omit<QuestTask, 'id'> & { id?: string }, targetId: string, targetType: 'role' | 'skill') {
  const userId = await requireAuth();

  const { error } = await supabase.from('quest_tasks').upsert({
    id: task.id || undefined, // Supabase gen_random_uuid will generate if undefined
    profile_id: userId,
    target_id: targetId,
    target_type: targetType,
    name: task.name,
    measurable_type: task.measurableType,
    measurable_value: task.measurableValue,
    deadline: task.deadline,
    completed: task.completed,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error saving quest task:', error);
    throw new Error('Failed to save task.');
  }

  revalidatePath('/');
}

export async function deleteQuestTask(taskId: string) {
  const userId = await requireAuth();

  const { error } = await supabase
    .from('quest_tasks')
    .delete()
    .eq('profile_id', userId)
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting quest task:', error);
    throw new Error('Failed to remove task from checklist.');
  }

  revalidatePath('/');
}

// ==========================================
// 5. MANAGER SHARING ACTIONS
// ==========================================

export async function fetchShareLinks() {
  const userId = await requireAuth();

  const { data, error } = await supabase
    .from('shared_links')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching share links:', error);
    throw new Error('Failed to load sharing history.');
  }

  return data;
}

export async function generateShareLink(label: string, expiryDays?: number) {
  const userId = await requireAuth();

  // Secure high-entropy token generated via server crypto module
  const token = crypto.randomUUID();
  
  let expiresAt: string | null = null;
  if (expiryDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    expiresAt = expiryDate.toISOString();
  }

  const { data, error } = await supabase
    .from('shared_links')
    .insert({
      profile_id: userId,
      token,
      label,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error generating share link:', error);
    throw new Error('Failed to generate secure share link.');
  }

  revalidatePath('/');
  return data;
}

export async function toggleShareLinkStatus(tokenId: string, active: boolean) {
  const userId = await requireAuth();

  const { error } = await supabase
    .from('shared_links')
    .update({ active })
    .eq('profile_id', userId)
    .eq('id', tokenId);

  if (error) {
    console.error('Error toggling share link:', error);
    throw new Error('Failed to change share link status.');
  }

  revalidatePath('/');
}

export async function deleteShareLink(tokenId: string) {
  const userId = await requireAuth();

  const { error } = await supabase
    .from('shared_links')
    .delete()
    .eq('profile_id', userId)
    .eq('id', tokenId);

  if (error) {
    console.error('Error deleting share link:', error);
    throw new Error('Failed to revoke share link.');
  }

  revalidatePath('/');
}
