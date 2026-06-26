import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, ChevronLeft, X, Plus, RotateCcw } from 'lucide-react';
import { careerRoles } from './career-data';
import { getSkillsForArchetype } from '../data/skills-data';
import { CATEGORY_COLORS } from '../config/tokens';
import {
  CATEGORY_META,
  getDefaultAllocation,
  type TimeAllocation,
} from '../data/time-allocation-data';

// ── Types ────────────────────────────────────────────────────────────────────

export type DesignArchetype =
  | 'product-design'
  | 'ux-design-research'
  | 'visual-design'
  | 'service-design'
  | 'interaction-design'
  | 'content-design'
  | 'motion-design'
  | 'design-systems';

export interface OnboardingResult {
  archetype: DesignArchetype;
  excludedSkillIds: string[];
  currentRoleId: string | null;
  customTimeAllocation: TimeAllocation | null;
  /** Key: "${level}-${track}" — only contains user-overridden entries */
  customTimeAllocations: Record<string, TimeAllocation>;
}

// ── Static data ──────────────────────────────────────────────────────────────

const archetypeOptions: { value: DesignArchetype; label: string; description: string; icon: string }[] = [
  { value: 'product-design',      label: 'Product Design',        icon: '📱', description: 'End-to-end design of digital products, from user flows to high-fidelity UI and design system governance.' },
  { value: 'ux-design-research',  label: 'UX Design + Research',  icon: '🔍', description: 'Combines designing user experiences and researching user needs and behaviors. Dual methodology.' },
  { value: 'visual-design',       label: 'Visual Design',         icon: '🎨', description: 'Creating aesthetically compelling designs through typography, color, layout, and iconography.' },
  { value: 'service-design',      label: 'Service Design',        icon: '🔄', description: 'Designs end-to-end service experiences across all touchpoints (physical, digital, human).' },
  { value: 'interaction-design',  label: 'Interaction Design',    icon: '⚡', description: 'Specializes in how users interact with products: patterns, flows, and micro-interactions.' },
  { value: 'content-design',      label: 'Content Design',        icon: '✍️', description: 'Crafts the language layer of digital products: UX copy, information architecture, content systems.' },
  { value: 'motion-design',       label: 'Motion Design',         icon: '🎬', description: 'Creates animations, transitions, and motion-based storytelling for digital products.' },
  { value: 'design-systems',      label: 'Design Systems',        icon: '🧩', description: 'Creates infrastructure other designers use: component libraries, design tokens, documentation.' },
];

const STEP_LABELS = ['Archetype', 'Skills', 'Seniority'];

// ── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all duration-300
              ${done ? 'bg-cyan-500 border-cyan-500 text-white' : active ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-600 text-slate-500'}`}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`ml-1.5 text-xs font-medium transition-colors ${active ? 'text-white' : done ? 'text-cyan-400' : 'text-slate-500'}`}>
              {STEP_LABELS[i]}
            </span>
            {i < total - 1 && (
              <div className={`mx-3 h-px w-8 transition-colors ${done ? 'bg-cyan-500' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Archetype ────────────────────────────────────────────────────────

function StepArchetype({
  selected,
  onSelect,
}: {
  selected: DesignArchetype | null;
  onSelect: (a: DesignArchetype) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Choose your design archetype</h2>
        <p className="text-gray-400 text-sm">Select the path that best matches your design focus.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {archetypeOptions.map((a) => {
          const isSelected = selected === a.value;
          return (
            <motion.button
              key={a.value}
              onClick={() => onSelect(a.value)}
              type="button"
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isSelected ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="text-3xl mb-2">{a.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1 leading-tight">{a.label}</h3>
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{a.description}</p>
              {isSelected && (
                <motion.div
                  className="absolute top-3 right-3 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 2: Skills ───────────────────────────────────────────────────────────

const SKILL_CATEGORY_TABS: { key: 'craft' | 'communication' | 'leadership' | 'business'; label: string; emoji: string; color: string }[] = [
  { key: 'craft',         label: 'Craft',        emoji: '🎨', color: CATEGORY_COLORS.craft },
  { key: 'communication', label: 'Communication', emoji: '💬', color: CATEGORY_COLORS.communication },
  { key: 'leadership',    label: 'Leadership',    emoji: '👥', color: CATEGORY_COLORS.leadership },
  { key: 'business',      label: 'Business',      emoji: '💼', color: CATEGORY_COLORS.business },
];

function StepSkills({
  archetype,
  excludedIds,
  onToggle,
}: {
  archetype: DesignArchetype;
  excludedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'craft' | 'communication' | 'leadership' | 'business'>('craft');

  const allSkills = useMemo(() => getSkillsForArchetype(archetype), [archetype]);

  const tabSkills = allSkills[activeTab] ?? [];
  const activeMeta = SKILL_CATEGORY_TABS.find((t) => t.key === activeTab)!;

  // Count excluded per tab for badge
  const excludedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of SKILL_CATEGORY_TABS) {
      counts[tab.key] = (allSkills[tab.key] ?? []).filter((s) => excludedIds.has(s.id)).length;
    }
    return counts;
  }, [allSkills, excludedIds]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white mb-1">Review your skill set</h2>
        <p className="text-gray-400 text-sm">Remove skills that aren't relevant to your path. You can always add them back later.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {SKILL_CATEGORY_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const excCount = excludedCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                ${isActive ? 'text-white' : 'text-gray-400 border-slate-700 bg-slate-800/40 hover:text-gray-200 hover:bg-slate-800'}`}
              style={isActive ? { borderColor: tab.color, background: `${tab.color}18`, color: tab.color } : {}}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {excCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                  -{excCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Skill chips */}
      <div
        className="min-h-[200px] p-4 rounded-xl border bg-slate-800/30"
        style={{ borderColor: `${activeMeta.color}30` }}
      >
        <div className="flex flex-wrap gap-2">
          {tabSkills.map((skill) => {
            const isExcluded = excludedIds.has(skill.id);
            return (
              <motion.button
                key={skill.id}
                onClick={() => onToggle(skill.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                  ${isExcluded
                    ? 'bg-slate-900/60 text-slate-500 border-slate-700 line-through'
                    : 'text-white border-opacity-50'}`}
                style={!isExcluded ? { backgroundColor: `${activeMeta.color}18`, borderColor: `${activeMeta.color}60`, color: activeMeta.color } : {}}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                title={isExcluded ? 'Click to include' : 'Click to exclude'}
              >
                {isExcluded ? <Plus className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
                {skill.name}
              </motion.button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {tabSkills.length - (excludedCounts[activeTab] ?? 0)} of {tabSkills.length} skills active
      </p>
    </div>
  );
}

// ── Step 3: Seniority + Time Allocation ─────────────────────────────────────

const ROLE_GROUPS = [
  { label: 'Foundation', ids: ['intern', 'junior-designer', 'mid-level-designer', 'senior-designer'] },
  { label: 'IC Track',   ids: ['staff', 'principal', 'distinguished'] },
  { label: 'Management', ids: ['manager', 'director', 'vp', 'cdo'] },
];

function StepSeniority({
  selectedRoleId,
  onSelectRole,
  allocation,
  onAllocationChange,
}: {
  selectedRoleId: string | null;
  onSelectRole: (id: string) => void;
  allocation: TimeAllocation | null;
  onAllocationChange: (a: TimeAllocation) => void;
}) {
  const total = allocation ? Object.values(allocation).reduce((s, v) => s + v, 0) : 0;
  const isValid = total === 100;

  function handleChange(key: keyof TimeAllocation, raw: string) {
    if (!allocation) return;
    const value = Math.max(0, Math.min(100, parseInt(raw) || 0));
    onAllocationChange({ ...allocation, [key]: value });
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white mb-1">Select your seniority level</h2>
        <p className="text-gray-400 text-sm">Choose your current role to set the default time allocation. Customise the percentages as needed.</p>
      </div>

      {/* Role picker */}
      <div className="space-y-4 mb-6">
        {ROLE_GROUPS.map((group) => {
          const roles = group.ids.map((id) => careerRoles.find((r) => r.id === id)).filter(Boolean) as typeof careerRoles;
          if (roles.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const isSelected = selectedRoleId === role.id;
                  return (
                    <motion.button
                      key={role.id}
                      onClick={() => onSelectRole(role.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                        ${isSelected ? 'text-white' : 'border-slate-700 bg-slate-800/40 text-gray-400 hover:text-gray-200 hover:bg-slate-800'}`}
                      style={isSelected ? { borderColor: role.color, background: `${role.color}18`, color: role.color } : {}}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: role.color }}
                      />
                      <span>L{role.level}</span>
                      <span>{role.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time allocation editor */}
      <AnimatePresence>
        {allocation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Time Allocation</h3>
              <button
                onClick={() => {
                  const role = careerRoles.find((r) => r.id === selectedRoleId);
                  if (role) onAllocationChange(getDefaultAllocation(role.level, role.track === 'single' ? 'ic' : role.track));
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset defaults
              </button>
            </div>

            {/* Segmented preview bar */}
            <div className="flex h-4 rounded-full overflow-hidden gap-px mb-4">
              {CATEGORY_META.map(({ key, color }) => {
                const pct = allocation[key];
                if (pct === 0) return null;
                return (
                  <div key={key} className="transition-all duration-300" style={{ flex: pct, backgroundColor: color, minWidth: 2 }} />
                );
              })}
              {total < 100 && (
                <div className="transition-all duration-300 bg-slate-700" style={{ flex: 100 - total, minWidth: 2 }} />
              )}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORY_META.map(({ key, label, color }) => (
                <div key={key}>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {label}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={allocation[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm text-center focus:outline-none focus:ring-1 transition-colors"
                      style={{ focusBorderColor: color } as React.CSSProperties}
                    />
                    <span className="text-slate-400 text-xs">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total indicator */}
            <div className={`mt-3 text-xs font-medium text-right transition-colors ${isValid ? 'text-emerald-400' : total > 100 ? 'text-red-400' : 'text-amber-400'}`}>
              {isValid ? '✓ Total: 100%' : total > 100 ? `⚠ Over by ${total - 100}% — reduce to reach 100%` : `${100 - total}% remaining to allocate`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedRoleId && (
        <p className="text-xs text-slate-500 mt-3 text-center">Select a role above to configure your time allocation</p>
      )}
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────

interface ArchetypeSelectorModalProps {
  isOpen: boolean;
  onComplete: (result: OnboardingResult) => void;
  onClose: () => void;
  currentArchetype?: DesignArchetype | null;
  currentExcludedSkillIds?: string[];
  currentRoleId?: string | null;
  currentTimeAllocations?: Record<string, TimeAllocation>;
}

export function ArchetypeSelectorModal({
  isOpen,
  onComplete,
  onClose,
  currentArchetype,
  currentExcludedSkillIds = [],
  currentRoleId: initialRoleId = null,
  currentTimeAllocations = {},
}: ArchetypeSelectorModalProps) {
  const [step, setStep] = useState(1);
  const [selectedArchetype, setSelectedArchetype] = useState<DesignArchetype | null>(currentArchetype ?? null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set(currentExcludedSkillIds));
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(initialRoleId);
  const [allocation, setAllocation] = useState<TimeAllocation | null>(() => {
    if (!initialRoleId) return null;
    const role = careerRoles.find((r) => r.id === initialRoleId);
    if (!role) return null;
    const key = `${role.level}-${role.track}`;
    return currentTimeAllocations[key] ?? getDefaultAllocation(role.level, role.track === 'single' ? 'ic' : role.track);
  });

  // Reset internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedArchetype(currentArchetype ?? null);
      setExcludedIds(new Set(currentExcludedSkillIds));
      setSelectedRoleId(initialRoleId);
      if (initialRoleId) {
        const role = careerRoles.find((r) => r.id === initialRoleId);
        if (role) {
          const key = `${role.level}-${role.track}`;
          setAllocation(currentTimeAllocations[key] ?? getDefaultAllocation(role.level, role.track === 'single' ? 'ic' : role.track));
        }
      } else {
        setAllocation(null);
      }
    }
  // Intentionally only re-run when the modal opens — other deps are stable props
  // that don't need to re-trigger a reset mid-session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleSelectRole(id: string) {
    const role = careerRoles.find((r) => r.id === id);
    if (!role) return;
    setSelectedRoleId(id);
    const key = `${role.level}-${role.track}`;
    setAllocation(currentTimeAllocations[key] ?? getDefaultAllocation(role.level, role.track === 'single' ? 'ic' : role.track));
  }

  function toggleSkill(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFinish() {
    if (!selectedArchetype) return;
    const role = selectedRoleId ? careerRoles.find((r) => r.id === selectedRoleId) : null;
    const customTimeAllocations: Record<string, TimeAllocation> = { ...currentTimeAllocations };
    if (role && allocation) {
      const defaultAlloc = getDefaultAllocation(role.level, role.track === 'single' ? 'ic' : role.track);
      const isCustom = (Object.keys(allocation) as (keyof TimeAllocation)[]).some((k) => allocation[k] !== defaultAlloc[k]);
      if (isCustom) {
        customTimeAllocations[`${role.level}-${role.track}`] = allocation;
      }
    }
    onComplete({
      archetype: selectedArchetype,
      excludedSkillIds: [...excludedIds],
      currentRoleId: selectedRoleId,
      customTimeAllocation: allocation,
      customTimeAllocations,
    });
  }

  const canNext = step === 1 ? !!selectedArchetype : true;
  const total = allocation ? Object.values(allocation).reduce((s, v) => s + v, 0) : 0;
  const canFinish = !!selectedArchetype && (allocation === null || total === 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={currentArchetype ? onClose : undefined}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-800 my-4"
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 16 }}
              transition={{ type: 'spring', duration: 0.45 }}
            >
              {/* Header */}
              <div className="px-8 py-5 border-b border-slate-800 flex items-center justify-between">
                <StepIndicator current={step - 1} total={3} />
                {currentArchetype && (
                  <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-full ml-4">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Step content */}
              <div className="px-8 py-7 overflow-y-auto max-h-[70vh]">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <StepArchetype selected={selectedArchetype} onSelect={setSelectedArchetype} />
                    </motion.div>
                  )}
                  {step === 2 && selectedArchetype && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <StepSkills archetype={selectedArchetype} excludedIds={excludedIds} onToggle={toggleSkill} />
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <StepSeniority
                        selectedRoleId={selectedRoleId}
                        onSelectRole={handleSelectRole}
                        allocation={allocation}
                        onAllocationChange={setAllocation}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => step > 1 ? setStep(step - 1) : onClose?.()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${step === 1 && !currentArchetype ? 'invisible' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>

                <div className="flex gap-2">
                  {step < 3 && (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={!canNext}
                      className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {step === 3 && (
                    <>
                      {allocation && (
                        <button
                          onClick={() => {
                            setSelectedRoleId(null);
                            setAllocation(null);
                            handleFinish();
                          }}
                          className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
                        >
                          Skip seniority
                        </button>
                      )}
                      <button
                        onClick={handleFinish}
                        disabled={!canFinish}
                        className="btn-primary flex items-center gap-2 px-5 py-2"
                      >
                        <Check className="w-4 h-4" />
                        {currentArchetype ? 'Save changes' : 'Get started'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
