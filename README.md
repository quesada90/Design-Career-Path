# Design Career Path

An interactive web app that helps product designers visualize their career progression, track skill development, and set actionable goals — from Intern all the way to VP of Design.

---

## Overview

Design Career Path gives designers a structured, personalized map of their growth. After choosing a **design archetype** (Product Design, UX Research, Visual Design, Service Design, or Interaction Design), the app generates a tailored career graph, skill tree, and quest log. Managers can be shared a read-only link without needing an account.

### Key Features

- **Career Path Graph** — Interactive node map across two tracks: Individual Contributor (IC) and Management, with 9 seniority levels from Intern to VP/Director.
- **Skill Tree** — Force-directed graph visualization of skills grouped into Craft, Communication, Leadership, and Business categories, filtered by your archetype.
- **Quest Log** — Create time-bound, measurable tasks tied to target roles and skills (quantity or quality-based milestones with deadlines).
- **Onboarding Wizard** — Select your archetype, current role, and customize time allocation across skill categories.
- **Public Sharing** — Generate expiring, read-only share links for manager reviews (no login required for viewers).
- **Persistent Progress** — All data (proficiencies, targets, tasks) is saved to Supabase and synced across sessions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | React 18, Tailwind CSS 4, shadcn/ui (Radix UI) |
| Auth | [Clerk](https://clerk.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Animations | [Motion (Framer Motion)](https://motion.dev/) |
| Charts | Recharts, react-force-graph-2d |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Clerk](https://clerk.com/) account (free tier works)
- A [Supabase](https://supabase.com/) project (free tier works)

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/career-path.git
cd career-path

# Install dependencies
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# Clerk — from https://dashboard.clerk.com under API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase — from https://supabase.com under Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, never expose client-side
```

### Database Setup

Run the migration against your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or paste the migration file manually in the Supabase SQL editor
supabase/migrations/20260521_init.sql
```

The migration creates the following tables:

| Table | Purpose |
|---|---|
| `profiles` | User profile, archetype, current/target roles |
| `skill_proficiencies` | Per-user skill levels (know / experience / master) |
| `target_skills` | Skills a user is actively working toward |
| `quest_tasks` | Time-bound tasks tied to roles or skills |
| `shared_links` | Expiring read-only share tokens for managers |

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Root — renders the main App component
│   ├── layout.tsx              # Root layout with Clerk provider
│   ├── sign-in/ / sign-up/     # Clerk auth pages
│   └── shared/[token]/         # Public read-only share view
│
├── src/app/
│   ├── App.tsx                 # Main application shell (3 tabs)
│   ├── actions.ts              # Server actions (Supabase CRUD)
│   ├── components/             # All UI components
│   │   ├── career-data.ts      # Role definitions (9 levels × 2 tracks)
│   │   ├── archetype-selector-modal.tsx
│   │   ├── career-node.tsx
│   │   ├── skill-force-graph.tsx
│   │   ├── quest-log.tsx
│   │   ├── share-modal.tsx
│   │   └── ui/                 # shadcn/ui base components
│   ├── data/
│   │   ├── skills-data.ts      # Skill definitions per archetype
│   │   └── time-allocation-data.ts
│   ├── types/
│   │   └── quest-log.ts        # Quest task types + UUID helpers
│   └── utils/
│       └── career-path-logic.ts
│
├── supabase/migrations/        # Database schema
└── .env.example                # Environment variable template
```

---

## Design Archetypes

| Archetype | Focus |
|---|---|
| Product Design | End-to-end digital product design, UI, and design systems |
| UX Design + Research | User experience design paired with research methodology |
| Visual Design | Typography, color, layout, iconography, and brand |
| Service Design | Cross-channel experiences across physical and digital touchpoints |
| Interaction Design | Patterns, flows, and micro-interactions |

Each archetype surfaces a tailored subset of skills across four competency pillars: **Craft**, **Communication**, **Leadership**, and **Business**.

---

## Career Tracks

After Senior Designer, the path forks:

- **IC Track** — Staff Designer → Principal Designer → Distinguished Designer → Fellow
- **Management Track** — Lead Designer → Design Manager → Director → VP of Design

---

## License

Private project. All rights reserved.
