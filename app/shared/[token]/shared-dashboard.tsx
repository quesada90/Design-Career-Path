'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Printer, Shield, ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';
import { CareerNode } from '../../../src/app/components/career-node';
import { ConnectionLine } from '../../../src/app/components/connection-line';
import { RoleModal } from '../../../src/app/components/role-modal';
import { SidebarLabels } from '../../../src/app/components/sidebar-labels';
import { SkillTreeNavigation } from '../../../src/app/components/skill-tree-navigation';
import { SkillModal } from '../../../src/app/components/skill-modal';
import { QuestLog } from '../../../src/app/components/quest-log';
import { careerRoles, type CareerRole } from '../../../src/app/components/career-data';
import { getRoleState } from '../../../src/app/utils/career-path-logic';

const SkillForceGraph = dynamic(
  () => import('../../../src/app/components/skill-force-graph').then((mod) => mod.SkillForceGraph),
  { ssr: false }
);
import {
  getSkillsForArchetype,
  getRoleLevelFromId,
  type Skill,
  type SkillProficiency,
} from '../../../src/app/data/skills-data';
import type { QuestTargets, QuestTarget } from '../../../src/app/types/quest-log';

const SKILL_CATEGORY_COUNT = 4;
type ActiveTab = 'career-path' | 'skill-tree' | 'quest-log';

interface SharedDashboardProps {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    archetype: string | null;
    current_role_id: string | null;
    target_role_ids: string[];
    custom_time_allocations: Record<string, any>;
    excluded_skill_ids: string[];
  };
  skillProficiencies: Record<string, SkillProficiency>;
  targetSkillIds: string[];
  questTasks: any[];
}

export default function SharedDashboard({
  profile,
  skillProficiencies,
  targetSkillIds,
  questTasks,
}: SharedDashboardProps) {
  const [selectedRole, setSelectedRole] = useState<CareerRole | null>(null);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 1000 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('career-path');

  // Skill Tree Navigation State
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Map database tasks into client QuestTargets structure on load
  const [questTargets] = useState<QuestTargets>(() => {
    const mappedTargets: QuestTargets = {};
    questTasks.forEach((t: any) => {
      const targetId = t.target_id;
      if (!mappedTargets[targetId]) {
        let targetName = '';
        if (t.target_type === 'role') {
          const role = careerRoles.find(r => r.id === targetId);
          targetName = role ? role.title : 'Role';
        } else {
          const arch = profile?.archetype;
          if (arch) {
            const skills = getSkillsForArchetype(arch as any);
            const allSkills = [...skills.craft, ...skills.communication, ...skills.leadership, ...skills.business];
            const skillObj = allSkills.find(s => s.id === targetId);
            targetName = skillObj ? skillObj.name : 'Skill';
          } else {
            targetName = 'Skill';
          }
        }
        mappedTargets[targetId] = {
          id: targetId,
          type: t.target_type,
          name: targetName,
          tasks: []
        };
      }
      mappedTargets[targetId].tasks.push({
        id: t.id,
        name: t.name,
        measurableType: t.measurable_type as any,
        measurableValue: t.measurable_value,
        deadline: t.deadline,
        completed: t.completed
      });
    });
    return mappedTargets;
  });

  const designArchetype = profile.archetype as any;
  const currentRoleId = profile.current_role_id;
  const targetRoleIds = profile.target_role_ids;
  const excludedSkillIds = profile.excluded_skill_ids;
  const customTimeAllocations = profile.custom_time_allocations as any;

  // Reset active category index if it's out of bounds
  useEffect(() => {
    if (activeCategoryIndex >= SKILL_CATEGORY_COUNT) {
      setActiveCategoryIndex(0);
    }
  }, [activeCategoryIndex]);

  // Get current role level for skill unlocking
  const currentRoleLevel = getRoleLevelFromId(currentRoleId);

  // Get current role color for skill tree
  const currentRole = careerRoles.find((r) => r.id === currentRoleId);
  const roleColor = currentRole?.color || '#06b6d4'; // Default to cyan

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    const timeoutId = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleNodeClick = (role: CareerRole) => {
    setSelectedRole(role);
  };

  const handleCloseModal = () => {
    setSelectedRole(null);
  };

  // Close modal when switching tabs
  useEffect(() => {
    if (selectedRole) {
      setSelectedRole(null);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get all connections for drawing lines
  const connections: Array<{
    from: CareerRole;
    to: CareerRole;
    color: string;
  }> = [];

  careerRoles.forEach((role) => {
    role.connections.forEach((connId) => {
      const toRole = careerRoles.find((r) => r.id === connId);
      if (toRole) {
        connections.push({
          from: role,
          to: toRole,
          color: toRole.color,
        });
      }
    });
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white relative">
      {/* Inject print custom CSS to re-adjust page elements */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html, .min-h-screen {
            background: #090d16 !important;
            color: white !important;
          }
          header, .no-print, button, .zoom-controls, .minimap, .instructions {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* Top Banner indicating Co-viewing Mode */}
      <div className="bg-gradient-to-r from-emerald-600/90 via-cyan-600/90 to-emerald-600/90 px-4 py-2 flex items-center justify-center gap-2 text-center text-xs font-semibold text-white shadow-md z-40 sticky top-0 no-print border-b border-emerald-500/20">
        <Shield className="w-4 h-4 animate-pulse flex-shrink-0" />
        <span>Co-viewing Mode (Read-Only) • Synchronized from {profile.full_name || 'Designer'}'s live growth profile</span>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-8 z-30 no-print">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Designer identity */}
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Avatar'}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-sm md:text-base font-bold text-white leading-tight">
                  {profile.full_name || 'Designer Journey'}
                </h1>
                <span className="text-[10px] text-cyan-400 font-mono capitalize">
                  {profile.archetype?.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Center: Navigation Tabs */}
            <nav className="flex-1 flex justify-center">
              <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setActiveTab('career-path')}
                  className={`px-3 md:px-5 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ${
                    activeTab === 'career-path'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Career Map
                </button>
                <button
                  onClick={() => setActiveTab('skill-tree')}
                  className={`px-3 md:px-5 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ${
                    activeTab === 'skill-tree'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Skill Tree
                </button>
                <button
                  onClick={() => setActiveTab('quest-log')}
                  className={`px-3 md:px-5 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ${
                    activeTab === 'quest-log'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Quest Checklist
                </button>
              </div>
            </nav>

            {/* Right: Print / Save PDF Button */}
            <div className="flex items-center">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/55 text-xs md:text-sm font-medium transition-all duration-300 group cursor-pointer"
                title="Save Snapshot to PDF / Print"
              >
                <Printer className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                <span className="hidden sm:inline text-gray-300 group-hover:text-white transition-colors">Print PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="print-full-width">
        {activeTab === 'career-path' && (
          <div className="relative w-full py-6 md:py-12 overflow-x-hidden">
            <div className="relative w-full px-24 md:px-40 overflow-x-auto">
              <div className="relative w-full min-w-[600px] max-w-5xl mx-auto">
                
                {/* Track Labels */}
                <div className="grid grid-cols-2 gap-8 mb-3 md:mb-4 px-4 md:px-8 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="text-white font-semibold text-sm md:text-base">
                      Craft Leadership
                    </div>
                    <div className="text-gray-500 text-xs">(IC)</div>
                  </div>

                  <div className="text-center">
                    <div className="text-white font-semibold text-sm md:text-base">
                      People Leadership
                    </div>
                    <div className="text-gray-500 text-xs">(M)</div>
                  </div>
                </div>

                {/* Diagram Area */}
                <div className="relative">
                  {/* Left Sidebar */}
                  <div className="absolute left-0 top-0 bottom-0 -ml-24 md:-ml-36">
                    <SidebarLabels position="left" />
                  </div>

                  {/* Right Sidebar */}
                  <div className="absolute right-0 top-0 bottom-0 -mr-24 md:-mr-36">
                    <SidebarLabels position="right" />
                  </div>

                  {/* Main Diagram */}
                  <div
                    ref={containerRef}
                    className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-slate-900/30 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-visible mx-auto"
                  >
                    {/* SVG for Connection Lines */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 1 }}
                    >
                      {connections.map((conn, idx) => {
                        const isHighlighted =
                          hoveredRoleId === conn.from.id ||
                          hoveredRoleId === conn.to.id ||
                          selectedRole?.id === conn.from.id ||
                          selectedRole?.id === conn.to.id;

                        const fromX = (conn.from.x / 100) * containerSize.width;
                        const fromY = (conn.from.y / 100) * containerSize.height;
                        const toX = (conn.to.x / 100) * containerSize.width;
                        const toY = (conn.to.y / 100) * containerSize.height;

                        return (
                          <ConnectionLine
                            key={idx}
                            fromX={fromX}
                            fromY={fromY}
                            toX={toX}
                            toY={toY}
                            color={conn.color}
                            isHighlighted={isHighlighted}
                          />
                        );
                      })}
                    </svg>

                    {/* Career Nodes */}
                    <div className="absolute inset-0" style={{ zIndex: 2 }}>
                      {careerRoles.map((role) => {
                        const roleState = getRoleState(role.id, currentRoleId, targetRoleIds);
                        
                        return (
                          <div
                            key={role.id}
                            onMouseEnter={() => setHoveredRoleId(role.id)}
                            onMouseLeave={() => setHoveredRoleId(null)}
                          >
                            <CareerNode
                              {...role}
                              onClick={() => handleNodeClick(role)}
                              isActive={
                                selectedRole?.id === role.id ||
                                hoveredRoleId === role.id
                              }
                              roleState={roleState}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-6 md:mt-8">
                  <div className="text-center">
                    <div className="text-white font-semibold text-sm md:text-base">
                      Common Trail
                    </div>
                    <div className="text-gray-500 text-xs">(Technical)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skill Tree Tab */}
        {activeTab === 'skill-tree' && designArchetype && (() => {
          const excludedSet = new Set(excludedSkillIds);
          const filterSkills = (list: any[]) => list.filter((s) => !excludedSet.has(s.id));
          const raw = getSkillsForArchetype(designArchetype);
          const categories = [
            {
              name: '🎨 Craft',
              description: `${designArchetype.charAt(0).toUpperCase() + designArchetype.slice(1)}-specific skills to master design craft`,
              skills: filterSkills(raw.craft),
              color: roleColor,
              icon: '🎨',
            },
            {
              name: '💬 Communication',
              description: 'Communicate, collaborate, and influence across teams and the industry',
              skills: filterSkills(raw.communication),
              color: '#ec4899',
              icon: '💬',
            },
            {
              name: '👥 Leadership',
              description: 'Lead teams, mentor designers, and grow organizational design impact',
              skills: filterSkills(raw.leadership),
              color: '#a855f7',
              icon: '👥',
            },
            {
              name: '💼 Business',
              description: 'Align design with business strategy and demonstrate impact',
              skills: filterSkills(raw.business),
              color: '#3b82f6',
              icon: '💼',
            },
          ];

          const activeCategory = categories[activeCategoryIndex];

          if (!activeCategory || !activeCategory.skills) {
            return null;
          }

          return (
            <div className="relative w-full min-h-[calc(100vh-80px)]">
              {/* Navigation */}
              <div className="no-print">
                <SkillTreeNavigation
                  categories={categories}
                  activeIndex={activeCategoryIndex}
                  onCategoryChange={setActiveCategoryIndex}
                />
              </div>

              {/* Active Category Content */}
              <div className="h-full pb-20 md:pb-16">
                <SkillForceGraph
                  skills={activeCategory.skills}
                  skillProficiencies={skillProficiencies}
                  targetSkillIds={targetSkillIds}
                  currentRoleLevel={currentRoleLevel}
                  onSkillClick={(skill) => setSelectedSkill(skill)}
                  categoryName={activeCategory.name}
                  categoryDescription={activeCategory.description}
                  color={activeCategory.color}
                />
              </div>
            </div>
          );
        })()}

        {/* Quest Log Tab */}
        {activeTab === 'quest-log' && (
          <QuestLog
            targets={Object.values(questTargets).sort((a, b) => {
              if (a.type === 'role' && b.type === 'skill') return -1;
              if (a.type === 'skill' && b.type === 'role') return 1;
              return 0;
            })}
            readOnly={true}
          />
        )}
      </main>

      {/* Role Details Modal (Read-Only) */}
      {selectedRole && (
        <RoleModal
          isOpen={!!selectedRole}
          onClose={handleCloseModal}
          roleId={selectedRole.id}
          title={selectedRole.title}
          level={selectedRole.level}
          track={selectedRole.track}
          color={selectedRole.color}
          description={selectedRole.description}
          requirements={selectedRole.requirements}
          skills={selectedRole.skills}
          currentRoleId={currentRoleId}
          targetRoleIds={targetRoleIds}
          skillProficiencies={skillProficiencies}
          targetSkillIds={targetSkillIds}
          designArchetype={designArchetype}
          onSetCurrentRole={() => {}}
          onSetTargetRole={() => {}}
          onClearCurrentRole={() => {}}
          onClearTargetRole={() => {}}
          onSwitchToSkillTree={() => setActiveTab('skill-tree')}
          customTimeAllocations={customTimeAllocations}
          readOnly={true}
        />
      )}

      {/* Skill Details Modal (Read-Only) */}
      {selectedSkill && (
        <SkillModal
          isOpen={!!selectedSkill}
          onClose={() => setSelectedSkill(null)}
          skill={selectedSkill}
          currentProficiency={skillProficiencies[selectedSkill.id] || 'locked'}
          onProficiencyChange={() => {}}
          isUnlocked={currentRoleLevel >= selectedSkill.unlockAtLevel}
          targetSkillIds={targetSkillIds}
          onToggleTarget={() => {}}
          readOnly={true}
        />
      )}
    </div>
  );
}
