-- ==========================================
-- 1. EXTENSIONS & TRIGGERS CONFIGURATION
-- ==========================================

-- Enable modern secure UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standard function to keep updated_at timestamps current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

-- A. Profiles Table (1-to-1 mapping with Clerk authenticated users)
CREATE TABLE public.profiles (
    id VARCHAR(255) PRIMARY KEY, -- Populated with Clerk User ID upon sign-up webhook
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    archetype VARCHAR(100), -- Chosen design archetype (e.g., 'product-design')
    current_role_id VARCHAR(100), -- e.g., 'junior-designer'
    target_role_ids TEXT[] DEFAULT '{}',
    custom_time_allocations JSONB DEFAULT '{}'::jsonb, -- User overrides of standard levels
    excluded_skill_ids TEXT[] DEFAULT '{}', -- Custom disabled skills
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- B. Skill Proficiencies Table (Records current designer competencies)
CREATE TABLE public.skill_proficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(255) REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) NOT NULL, -- e.g., 'craft-pd-figma'
    proficiency_level VARCHAR(50) NOT NULL CHECK (proficiency_level IN ('know', 'experience', 'master')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, skill_id)
);

-- C. Target Skills Table (Skills designers are focusing on for future progression)
CREATE TABLE public.target_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(255) REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, skill_id)
);

-- D. Quest Tasks Table (Checklists mapping to selected target skills and roles)
CREATE TABLE public.quest_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(255) REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id VARCHAR(100) NOT NULL, -- references either roleId or skillId
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('role', 'skill')),
    name TEXT NOT NULL,
    measurable_type VARCHAR(20) NOT NULL CHECK (measurable_type IN ('quantity', 'quality')),
    measurable_value VARCHAR(255) NOT NULL,
    deadline DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- E. Shared Links Table (Public secure URLs for manager co-viewing)
CREATE TABLE public.shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(255) REFERENCES public.profiles(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL, -- High-entropy secure lookup slug (e.g. UUID)
    label VARCHAR(255), -- User identification label (e.g., 'Q3 Sync with Javier')
    active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional auto-expiry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. INDEXES FOR LOOKUP OPTIMIZATION
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_skill_proficiencies_profile ON public.skill_proficiencies(profile_id);
CREATE INDEX IF NOT EXISTS idx_target_skills_profile ON public.target_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_quest_tasks_profile ON public.quest_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_token ON public.shared_links(token);

-- ==========================================
-- 4. UPDATE TRIGGERS
-- ==========================================
CREATE TRIGGER tr_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_skill_proficiencies_updated_at
BEFORE UPDATE ON public.skill_proficiencies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_quest_tasks_updated_at
BEFORE UPDATE ON public.quest_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_proficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- A. PROFILES Security Rules
-- Designers can manage their own profiles.
CREATE POLICY "Users can manage their own profiles"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Public can view profiles ONLY if they possess a valid, active share link.
CREATE POLICY "Public read profiles with active share link"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.shared_links
        WHERE shared_links.profile_id = profiles.id
          AND shared_links.token = current_setting('request.headers', true)::json->>'x-share-token'
          AND shared_links.active = true
          AND (shared_links.expires_at IS NULL OR shared_links.expires_at > CURRENT_TIMESTAMP)
    )
);

-- B. SKILL PROFICIENCIES Security Rules
CREATE POLICY "Users can manage their own skills"
ON public.skill_proficiencies FOR ALL
TO authenticated
USING (auth.uid()::text = profile_id)
WITH CHECK (auth.uid()::text = profile_id);

CREATE POLICY "Public read skills with active share link"
ON public.skill_proficiencies FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.shared_links
        WHERE shared_links.profile_id = skill_proficiencies.profile_id
          AND shared_links.token = current_setting('request.headers', true)::json->>'x-share-token'
          AND shared_links.active = true
          AND (shared_links.expires_at IS NULL OR shared_links.expires_at > CURRENT_TIMESTAMP)
    )
);

-- C. TARGET SKILLS Security Rules
CREATE POLICY "Users can manage their own targets"
ON public.target_skills FOR ALL
TO authenticated
USING (auth.uid()::text = profile_id)
WITH CHECK (auth.uid()::text = profile_id);

CREATE POLICY "Public read targets with active share link"
ON public.target_skills FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.shared_links
        WHERE shared_links.profile_id = target_skills.profile_id
          AND shared_links.token = current_setting('request.headers', true)::json->>'x-share-token'
          AND shared_links.active = true
          AND (shared_links.expires_at IS NULL OR shared_links.expires_at > CURRENT_TIMESTAMP)
    )
);

-- D. QUEST TASKS Security Rules
CREATE POLICY "Users can manage their own tasks"
ON public.quest_tasks FOR ALL
TO authenticated
USING (auth.uid()::text = profile_id)
WITH CHECK (auth.uid()::text = profile_id);

CREATE POLICY "Public read tasks with active share link"
ON public.quest_tasks FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.shared_links
        WHERE shared_links.profile_id = quest_tasks.profile_id
          AND shared_links.token = current_setting('request.headers', true)::json->>'x-share-token'
          AND shared_links.active = true
          AND (shared_links.expires_at IS NULL OR shared_links.expires_at > CURRENT_TIMESTAMP)
    )
);

-- E. SHARED LINKS Security Rules
-- Only authenticated owners can create, view, or toggle their share links.
CREATE POLICY "Users can manage their own share links"
ON public.shared_links FOR ALL
TO authenticated
USING (auth.uid()::text = profile_id)
WITH CHECK (auth.uid()::text = profile_id);

-- Anyone (including anon managers) can check if a specific link metadata is valid.
CREATE POLICY "Public read active share links metadata"
ON public.shared_links FOR SELECT
TO anon, authenticated
USING (
    active = true 
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
);
