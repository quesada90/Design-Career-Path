import { getSupabaseClient } from '../../../src/lib/supabase';
import SharedDashboard from './shared-dashboard';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { SkillProficiency } from '../../../src/app/data/skills-data';

interface SharedPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function SharedPage({ params }: SharedPageProps) {
  const { token } = await params;

  // Initialize customized Supabase client with token header injection
  const supabase = getSupabaseClient(token);

  // 1. Verify link status and check auto-expiration
  const { data: shareLink, error: linkError } = await supabase
    .from('shared_links')
    .select('*')
    .eq('token', token)
    .single();

  const isExpired = shareLink?.expires_at 
    ? new Date(shareLink.expires_at) < new Date() 
    : false;

  // Render a high-aesthetic warning screen if link is invalid, paused, or expired
  if (linkError || !shareLink || !shareLink.active || isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.05),transparent_60%)] pointer-events-none" />
        
        <div className="max-w-md w-full bg-slate-900/60 border-2 border-rose-500/25 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-rose-500/5 text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/30 mx-auto mb-6 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Sharing Link Inactive
          </h2>
          
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This growth path co-viewing link has expired, been paused by the designer, or is invalid. Please request a new sharing URL from the designer.
          </p>

          <div className="border-t border-slate-800/80 pt-6">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Career Path Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch all designer data in parallel (profile_id is known, safe to batch)
  const [
    { data: profile },
    { data: profs },
    { data: targets },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', shareLink.profile_id).single(),
    supabase.from('skill_proficiencies').select('skill_id, proficiency_level').eq('profile_id', shareLink.profile_id),
    supabase.from('target_skills').select('skill_id').eq('profile_id', shareLink.profile_id),
    supabase.from('quest_tasks').select('*').eq('profile_id', shareLink.profile_id),
  ]);

  // Convert array datasets into standard mapped objects for hydration
  const skillProficiencies: Record<string, SkillProficiency> = {};
  profs?.forEach((p) => {
    skillProficiencies[p.skill_id] = p.proficiency_level as SkillProficiency;
  });

  const targetSkillIds = targets?.map((t) => t.skill_id) ?? [];

  return (
    <SharedDashboard
      profile={profile}
      skillProficiencies={skillProficiencies}
      targetSkillIds={targetSkillIds}
      questTasks={tasks || []}
    />
  );
}
