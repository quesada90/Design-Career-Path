'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Share2, Loader2 } from 'lucide-react';
import { CATEGORY_COLORS } from './config/tokens';
import dynamic from 'next/dynamic';
import { CareerNode } from './components/career-node';
import { ConnectionLine, type ConnectionState } from './components/connection-line';
import { RoleModal } from './components/role-modal';
import { SidebarLabels } from './components/sidebar-labels';
import { ConfirmationModal } from './components/confirmation-modal';
import { ArchetypeSelectorModal, type DesignArchetype, type OnboardingResult } from './components/archetype-selector-modal';
import { SkillTreeNavigation } from './components/skill-tree-navigation';
import { SkillModal } from './components/skill-modal';
import { QuestLog } from './components/quest-log';
import { QuestCelebrationModal } from './components/quest-celebration-modal';
import { ShareModal } from './components/share-modal';
import { careerRoles, type CareerRole } from './components/career-data';
import { getRoleState, canSetAsTarget, getAvailableTargets, getCompletedRoles, getPathEdgesToCurrent } from './utils/career-path-logic';

const SkillForceGraph = dynamic(
  () => import('./components/skill-force-graph').then((mod) => mod.SkillForceGraph),
  { ssr: false }
);
import {
  getSkillsForArchetype,
  getAllSkillsForArchetype,
  getRoleLevelFromId,
  type Skill,
  type SkillProficiency,
} from './data/skills-data';
import type { QuestTargets, QuestTarget, QuestTask, MeasurableType } from './types/quest-log';
import { createNewTask, generateTaskId } from './types/quest-log';
import type { TimeAllocation } from './data/time-allocation-data';
import type { DbQuestTask } from './types/database';
import {
  fetchProfile,
  updateProfile,
  fetchSkillProficiencies,
  saveSkillProficiency,
  fetchTargetSkills,
  toggleTargetSkill,
  fetchQuestTasks,
  saveQuestTask,
  deleteQuestTask,
} from './actions';

const SKILL_CATEGORY_COUNT = 4;

type ActiveTab = 'career-path' | 'skill-tree' | 'quest-log';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<CareerRole | null>(null);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('career-path');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Skill Tree Navigation State
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Loading & Modal States
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showArchetypeModal, setShowArchetypeModal] = useState(false);

  // Core career path collaborative states
  const [designArchetype, setDesignArchetype] = useState<DesignArchetype | null>(null);
  const [excludedSkillIds, setExcludedSkillIds] = useState<string[]>([]);
  const [customTimeAllocations, setCustomTimeAllocations] = useState<Record<string, TimeAllocation>>({});
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
  const [targetRoleIds, setTargetRoleIds] = useState<string[]>([]);
  const [skillProficiencies, setSkillProficiencies] = useState<Record<string, SkillProficiency>>({});
  const [targetSkillIds, setTargetSkillIds] = useState<string[]>([]);
  const [questTargets, setQuestTargets] = useState<QuestTargets>({});

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTarget, setCelebrationTarget] = useState<{ id: string; name: string; type: 'role' | 'skill' } | null>(null);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingCurrentRole, setPendingCurrentRole] = useState<string | null>(null);

  // Tracks whether the initial DB fetch has completed at least once
  const initialLoadDoneRef = useRef(false);

  // Fetch all collaborative Supabase database states on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Fetch Profile
        const profile = await fetchProfile();
        if (profile) {
          setDesignArchetype(profile.archetype);
          setExcludedSkillIds(profile.excluded_skill_ids || []);
          setCustomTimeAllocations(profile.custom_time_allocations || {});
          setCurrentRoleId(profile.current_role_id || null);
          setTargetRoleIds(profile.target_role_ids || []);

          // Show archetype selector on first load if no archetype is set
          if (!profile.archetype) {
            setShowArchetypeModal(true);
          }
        } else {
          setShowArchetypeModal(true);
        }

        // 2. Fetch Skill Proficiencies
        const proficiencies = await fetchSkillProficiencies();
        setSkillProficiencies(proficiencies);

        // 3. Fetch Target Skills
        const targets = await fetchTargetSkills();
        setTargetSkillIds(targets);

        // 4. Fetch Quest Tasks
        const dbTasks = await fetchQuestTasks();
        
        // Map database tasks back to questTargets structure
        const mappedTargets: QuestTargets = {};
        dbTasks.forEach((t: DbQuestTask) => {
          const targetId = t.target_id;
          if (!mappedTargets[targetId]) {
            let targetName = '';
            if (t.target_type === 'role') {
              const role = careerRoles.find(r => r.id === targetId);
              targetName = role ? role.title : 'Role';
            } else {
              const arch = profile?.archetype;
              if (arch) {
                const skills = getSkillsForArchetype(arch);
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
            measurableType: t.measurable_type as MeasurableType,
            measurableValue: t.measurable_value,
            deadline: t.deadline,
            completed: t.completed
          });
        });
        
        setQuestTargets(mappedTargets);
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
      } finally {
        setLoading(false);
        initialLoadDoneRef.current = true;
      }
    }
    loadData();
  }, []);

  // Reset active category index if it's out of bounds
  useEffect(() => {
    if (activeCategoryIndex >= SKILL_CATEGORY_COUNT) {
      setActiveCategoryIndex(0);
    }
  }, [activeCategoryIndex]);

  const handleOnboardingComplete = async (result: OnboardingResult) => {
    try {
      setLoading(true);
      const newArchetypeSkills = getAllSkillsForArchetype(result.archetype);
      const validSkillIds = new Set(newArchetypeSkills.map((s) => s.id));

      // Remove excluded IDs that no longer exist in the new archetype
      const updatedExcludedSkills = result.excludedSkillIds.filter((id) => validSkillIds.has(id));
      setExcludedSkillIds(updatedExcludedSkills);

      // Prune proficiencies: keep skills that exist in the new archetype (shared + craft)
      const newProficiencies: Record<string, SkillProficiency> = {};
      const promises: Promise<any>[] = [];
      
      for (const [id, prof] of Object.entries(skillProficiencies)) {
        if (validSkillIds.has(id)) {
          newProficiencies[id] = prof;
        } else {
          // Delete from database
          promises.push(saveSkillProficiency(id, 'locked'));
        }
      }
      setSkillProficiencies(newProficiencies);

      // Prune target skill IDs that no longer exist
      const updatedTargetSkills = targetSkillIds.filter((id) => validSkillIds.has(id));
      for (const id of targetSkillIds) {
        if (!validSkillIds.has(id)) {
          promises.push(toggleTargetSkill(id)); // removes from targets
        }
      }
      setTargetSkillIds(updatedTargetSkills);

      setDesignArchetype(result.archetype);
      setCustomTimeAllocations(result.customTimeAllocations);
      if (result.currentRoleId) {
        setCurrentRoleId(result.currentRoleId);
      }

      // Save onboarding choices to database
      await updateProfile({
        archetype: result.archetype,
        current_role_id: result.currentRoleId || null,
        target_role_ids: [],
        custom_time_allocations: result.customTimeAllocations,
        excluded_skill_ids: updatedExcludedSkills
      });

      await Promise.all(promises);

      setActiveCategoryIndex(0);
      setShowArchetypeModal(false);
    } catch (err) {
      console.error('Failed to update onboarding choices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle skill proficiency change
  const handleProficiencyChange = async (skillId: string, proficiency: SkillProficiency) => {
    // Optimistic UI updates
    setSkillProficiencies((prev) => ({
      ...prev,
      [skillId]: proficiency,
    }));
    
    if (proficiency !== 'locked') {
      setTargetSkillIds((prev) => prev.filter((id) => id !== skillId));
    }

    // Save in database
    await saveSkillProficiency(skillId, proficiency);
  };

  // Handle target skill toggle
  const handleToggleTarget = async (skillId: string) => {
    const isRemoving = targetSkillIds.includes(skillId);
    
    setTargetSkillIds((prev) => {
      if (isRemoving) {
        return prev.filter((id) => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });

    if (isRemoving) {
      const targetQuest = questTargets[skillId];
      setQuestTargets((questPrev) => {
        const newTargets = { ...questPrev };
        delete newTargets[skillId];
        return newTargets;
      });
      if (targetQuest) {
        await Promise.all(targetQuest.tasks.map(t => deleteQuestTask(t.id)));
      }
    } else {
      // Generate default tasks for target skill in database
      if (designArchetype) {
        const skills = getSkillsForArchetype(designArchetype);
        const allSkills = [...skills.craft, ...skills.communication, ...skills.leadership, ...skills.business];
        const skill = allSkills.find((s) => s.id === skillId);
        if (skill) {
          const newTasks = createExampleTasks(skillId, 'skill', skill.name);
          setQuestTargets((prev) => ({
            ...prev,
            [skillId]: {
              id: skillId,
              type: 'skill',
              name: skill.name,
              tasks: newTasks
            }
          }));
          await Promise.all(newTasks.map(t => saveQuestTask(t, skillId, 'skill')));
        }
      }
    }

    // Database toggle
    await toggleTargetSkill(skillId);
  };

  // Completed roles set (includes current) for connection state computation
  const completedRoleIds = useMemo(
    () => new Set([...getCompletedRoles(currentRoleId), ...(currentRoleId ? [currentRoleId] : [])]),
    [currentRoleId]
  );

  // Path edges from hovered future node back to current — recomputed only when hovered node changes
  const futurePathEdges = useMemo(() => {
    if (!hoveredRoleId) return null;
    const state = getRoleState(hoveredRoleId, currentRoleId, targetRoleIds);
    if (state !== 'future') return null;
    return getPathEdgesToCurrent(hoveredRoleId, currentRoleId);
  }, [hoveredRoleId, currentRoleId, targetRoleIds]);

  // Get current role level for skill unlocking
  const currentRoleLevel = getRoleLevelFromId(currentRoleId);

  // Get current role color for skill tree
  const currentRole = careerRoles.find((r) => r.id === currentRoleId);
  const roleColor = currentRole?.color || CATEGORY_COLORS.craft;

  // Skill tree category definitions — memoized to avoid rebuilding on every render
  const skillTreeCategories = useMemo(() => {
    if (!designArchetype) return null;
    const excludedSet = new Set(excludedSkillIds);
    const filterSkills = (list: Skill[]) => list.filter((s) => !excludedSet.has(s.id));
    const raw = getSkillsForArchetype(designArchetype);
    return [
      {
        name: '🎨 Craft',
        description: `${designArchetype.charAt(0).toUpperCase() + designArchetype.slice(1)}-specific skills to master your design craft`,
        skills: filterSkills(raw.craft),
        color: roleColor,
        icon: '🎨',
      },
      {
        name: '💬 Communication',
        description: 'Communicate, collaborate, and influence across teams and the industry',
        skills: filterSkills(raw.communication),
        color: CATEGORY_COLORS.communication,
        icon: '💬',
      },
      {
        name: '👥 Leadership',
        description: 'Lead teams, mentor designers, and grow organizational design impact',
        skills: filterSkills(raw.leadership),
        color: CATEGORY_COLORS.leadership,
        icon: '👥',
      },
      {
        name: '💼 Business',
        description: 'Align design with business strategy and demonstrate impact',
        skills: filterSkills(raw.business),
        color: CATEGORY_COLORS.business,
        icon: '💼',
      },
    ];
  }, [designArchetype, excludedSkillIds, roleColor]);


  const handleNodeClick = useCallback((role: CareerRole) => {
    setSelectedRole(role);
  }, []);

  const handleCloseModal = () => {
    setSelectedRole(null);
  };

  // Close modal when switching tabs to ensure fresh data on reopen
  useEffect(() => {
    if (selectedRole) {
      setSelectedRole(null);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle setting current role
  const handleSetCurrentRole = async (roleId: string) => {
    if (currentRoleId === null) {
      // First time setting
      setCurrentRoleId(roleId);
      const newAvailableTargets = getAvailableTargets(roleId);
      const updatedTargets = targetRoleIds.filter((tId) => newAvailableTargets.includes(tId) || canSetAsTarget(tId, roleId));
      setTargetRoleIds(updatedTargets);

      await updateProfile({
        current_role_id: roleId,
        target_role_ids: updatedTargets
      });
    } else {
      setPendingCurrentRole(roleId);
      setShowConfirmation(true);
    }
  };

  // Handle setting target role
  const handleSetTargetRole = async (roleId: string) => {
    if (!canSetAsTarget(roleId, currentRoleId)) {
      return;
    }

    const updatedTargets = [roleId];
    setTargetRoleIds(updatedTargets);

    // If it's a brand new target, generate example tasks in the DB
    const role = careerRoles.find(r => r.id === roleId);
    if (role && !questTargets[roleId]) {
      const newTasks = createExampleTasks(roleId, 'role', role.title);
      setQuestTargets((prev) => ({
        ...prev,
        [roleId]: {
          id: roleId,
          type: 'role',
          name: role.title,
          tasks: newTasks
        }
      }));
      await Promise.all(newTasks.map(t => saveQuestTask(t, roleId, 'role')));
    }

    await updateProfile({
      target_role_ids: updatedTargets
    });
  };

  // Handle clearing current role
  const handleClearCurrentRole = async () => {
    setCurrentRoleId(null);
    setTargetRoleIds([]);

    await updateProfile({
      current_role_id: null,
      target_role_ids: []
    });
  };

  // Handle clearing target role
  const handleClearTargetRole = async (roleId: string) => {
    const updatedTargets = targetRoleIds.filter((id) => id !== roleId);
    setTargetRoleIds(updatedTargets);

    // Remove from state only — keep tasks in DB so they restore if role is re-selected
    setQuestTargets((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });

    await updateProfile({ target_role_ids: updatedTargets });
  };

  // Quest Log helpers for creating default items
  const createExampleTasks = (targetId: string, type: 'role' | 'skill', name: string): QuestTask[] => {
    if (type === 'role') {
      return [
        {
          id: generateTaskId(),
          name: 'Lead 3 high-impact projects',
          measurableType: 'quantity',
          measurableValue: '3',
          deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
        },
        {
          id: generateTaskId(),
          name: 'Mentor junior designers',
          measurableType: 'quantity',
          measurableValue: '2',
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
        },
      ];
    } else {
      return [
        {
          id: generateTaskId(),
          name: 'Practice this skill in real projects',
          measurableType: 'quantity',
          measurableValue: '5',
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
        },
        {
          id: generateTaskId(),
          name: 'Get feedback from peers',
          measurableType: 'quality',
          measurableValue: 'Positive feedback received',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
        },
      ];
    }
  };

  // Quest Log handlers
  const handleAddTask = useCallback(async (targetId: string) => {
    const newTask = createNewTask();
    let targetType: 'role' | 'skill' | undefined;

    setQuestTargets((prev) => {
      const target = prev[targetId];
      if (!target) return prev;
      targetType = target.type;
      return {
        ...prev,
        [targetId]: { ...target, tasks: [...target.tasks, newTask] },
      };
    });

    // Fall back to current snapshot if setter didn't run (target missing)
    if (!targetType) targetType = questTargets[targetId]?.type;
    if (targetType) await saveQuestTask(newTask, targetId, targetType);
  }, [questTargets]);

  const handleDeleteTask = useCallback(async (targetId: string, taskId: string) => {
    setQuestTargets((prev) => {
      const target = prev[targetId];
      if (!target) return prev;
      return {
        ...prev,
        [targetId]: { ...target, tasks: target.tasks.filter((t) => t.id !== taskId) },
      };
    });

    await deleteQuestTask(taskId);
  }, []);

  const handleToggleTask = async (targetId: string, taskId: string) => {
    const target = questTargets[targetId];
    if (!target) return;

    const updatedTasks = target.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    const allComplete = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);

    setQuestTargets((prev) => ({
      ...prev,
      [targetId]: { ...target, tasks: updatedTasks }
    }));

    const updatedTask = updatedTasks.find((t) => t.id === taskId);
    if (updatedTask) {
      await saveQuestTask(updatedTask, targetId, target.type);
    }

    if (allComplete) {
      handleTargetCompleted(targetId, target.type);
    }
  };

  const handleUpdateTask = async (
    targetId: string,
    taskId: string,
    field: keyof QuestTask,
    value: string | boolean
  ) => {
    const target = questTargets[targetId];
    if (!target) return;

    const updatedTasks = target.tasks.map((t) =>
      t.id === taskId ? { ...t, [field]: value } : t
    );

    setQuestTargets((prev) => ({
      ...prev,
      [targetId]: { ...target, tasks: updatedTasks }
    }));

    const updatedTask = updatedTasks.find((t) => t.id === taskId);
    if (updatedTask) {
      await saveQuestTask(updatedTask, targetId, target.type);
    }
  };

  const handleTargetCompleted = (targetId: string, type: 'role' | 'skill') => {
    const target = questTargets[targetId];
    if (!target) return;

    setCelebrationTarget({
      id: targetId,
      name: target.name,
      type,
    });
    setShowCelebration(true);
  };

  const handleUpdateProficiencyFromCelebration = () => {
    if (celebrationTarget && celebrationTarget.type === 'skill') {
      if (designArchetype) {
        const skills = getSkillsForArchetype(designArchetype);
        const allSkills = [...skills.craft, ...skills.communication, ...skills.leadership, ...skills.business];
        const skill = allSkills.find((s) => s.id === celebrationTarget.id);
        if (skill) {
          setSelectedSkill(skill);
          setActiveTab('skill-tree');
        }
      }
    }
  };

  // Get all connections for drawing lines — memoized since careerRoles is static
  const connections = useMemo(() => {
    const result: Array<{ from: CareerRole; to: CareerRole; color: string }> = [];
    careerRoles.forEach((role) => {
      role.connections.forEach((connId) => {
        const toRole = careerRoles.find((r) => r.id === connId);
        if (toRole) {
          result.push({ from: role, to: toRole, color: toRole.color });
        }
      });
    });
    return result;
  }, []); // careerRoles is a module-level constant — no deps needed

  // Pulse loading overlay if database is synchronizing on first load
  if (loading && !initialLoadDoneRef.current) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full"
        />
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        >
          Synchronizing Your Career Journey...
        </motion.h2>
        <p className="text-xs text-gray-500">Connecting to secure collaborative database</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo/Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
                Career Path
              </h1>
            </motion.div>

            {/* Center: Navigation Tabs */}
            <motion.nav
              className="flex-1 flex justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setActiveTab('career-path')}
                  className={`px-3 md:px-5 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-300 ${
                    activeTab === 'career-path'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Career Path
                </button>
                <button
                  onClick={() => setActiveTab('skill-tree')}
                  className={`px-3 md:px-5 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-300 ${
                    activeTab === 'skill-tree'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Skill Tree
                </button>
                <button
                  onClick={() => setActiveTab('quest-log')}
                  className={`px-3 md:px-5 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-300 ${
                    activeTab === 'quest-log'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Quest Log
                </button>
              </div>
            </motion.nav>

            {/* Right: Actions Block (Share Path + User Profile) */}
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Share Path Button */}
              {designArchetype && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs md:text-sm font-medium transition-all duration-300 group cursor-pointer shadow-md"
                  title="Share Growth Path"
                >
                  <Share2 className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                  <span className="hidden sm:inline text-gray-300 group-hover:text-white transition-colors">Share Path</span>
                </button>
              )}

              {/* Profile/Archetype Selector Button */}
              <button
                onClick={() => setShowArchetypeModal(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 transition-all duration-300 group cursor-pointer"
                aria-label="Profile & Settings"
                title="Change Archetype"
              >
                <User className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content - Conditionally render based on active tab */}
      {activeTab === 'career-path' && (
        <div className="relative w-full py-6 md:py-12 overflow-x-hidden">
          {/* Career Path Diagram Container - with padding for sidebars */}
          <div className="relative w-full md:px-40">
            <div className="relative w-[calc(100vw-32px)] md:w-full md:min-w-[600px] max-w-5xl mx-auto">
              
              {/* Track Labels - At Top */}
              <div className="grid grid-cols-2 gap-8 mb-3 md:mb-4 px-4 md:px-8 max-w-2xl mx-auto">
                {/* Craft Leadership */}
                <motion.div
                  className="relative text-center group"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onMouseEnter={() => setHoveredTrack('ic')}
                  onMouseLeave={() => setHoveredTrack(null)}
                >
                  <div className="text-white font-semibold text-sm md:text-base cursor-help">
                    Craft Leadership
                  </div>
                  <div className="text-gray-500 text-xs">(IC)</div>
                  
                  {/* Hover Tooltip */}
                  {hoveredTrack === 'ic' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-48 md:w-56"
                    >
                      <div className="bg-slate-800 border border-cyan-500/30 rounded-lg p-3 shadow-xl">
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Deep craft expertise and technical excellence
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* People Leadership */}
                <motion.div
                  className="relative text-center group"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onMouseEnter={() => setHoveredTrack('management')}
                  onMouseLeave={() => setHoveredTrack(null)}
                >
                  <div className="text-white font-semibold text-sm md:text-base cursor-help">
                    People Leadership
                  </div>
                  <div className="text-gray-500 text-xs">(M)</div>

                  {/* Hover Tooltip */}
                  {hoveredTrack === 'management' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-48 md:w-56"
                    >
                      <div className="bg-slate-800 border border-cyan-500/30 rounded-lg p-3 shadow-xl">
                        <p className="text-xs text-gray-300 leading-relaxed">
                          People leadership, team building, and organizational impact
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Diagram Area - Portrait Orientation */}
              <div className="relative">
                {/* Left Sidebar - hidden on mobile */}
                <div className="hidden md:block absolute left-0 top-0 bottom-0 md:-ml-36">
                  <SidebarLabels position="left" />
                </div>

                {/* Right Sidebar - hidden on mobile */}
                <div className="hidden md:block absolute right-0 top-0 bottom-0 md:-mr-36">
                  <SidebarLabels position="right" />
                </div>

                {/* Main Diagram */}
                <div
                  className="relative w-full aspect-[3/4] md:aspect-[4/5] bg-slate-900/30 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-visible mx-auto"
                >
                  {/* SVG for Connection Lines */}
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    {connections.map((conn, idx) => {
                      const resolveX = (role: CareerRole) =>
                        isMobile && role.track === 'ic' ? 35
                        : isMobile && role.track === 'management' ? 65
                        : role.x;

                      const edgeKey = `${conn.from.id}->${conn.to.id}`;
                      const isCompletedEdge =
                        completedRoleIds.has(conn.from.id) && completedRoleIds.has(conn.to.id);

                      let connectionState: ConnectionState;
                      if (isCompletedEdge) {
                        connectionState = 'completed';
                      } else if (hoveredRoleId) {
                        const isOnPath = futurePathEdges?.has(edgeKey) ?? false;
                        // Only use adjacency when NOT in future-path mode — otherwise the forward
                        // edge from the hovered node would also highlight
                        const isAdjacent = !futurePathEdges &&
                          (hoveredRoleId === conn.from.id || hoveredRoleId === conn.to.id);
                        connectionState = isOnPath || isAdjacent ? 'highlighted' : 'dim';
                      } else {
                        connectionState = 'default';
                      }

                      return (
                        <ConnectionLine
                          key={idx}
                          fromX={resolveX(conn.from)}
                          fromY={conn.from.y}
                          toX={resolveX(conn.to)}
                          toY={conn.to.y}
                          color={conn.color}
                          connectionState={connectionState}
                        />
                      );
                    })}
                  </svg>

                  {/* Career Nodes */}
                  <div className="absolute inset-0" style={{ zIndex: 2 }}>
                    {careerRoles.map((role) => {
                      const roleState = getRoleState(role.id, currentRoleId, targetRoleIds);
                      const x =
                        isMobile && role.track === 'ic' ? 35
                        : isMobile && role.track === 'management' ? 65
                        : role.x;

                      return (
                        <div
                          key={role.id}
                          onMouseEnter={() => setHoveredRoleId(role.id)}
                          onMouseLeave={() => setHoveredRoleId(null)}
                        >
                          <CareerNode
                            {...role}
                            x={x}
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

              {/* Common Trail Label - At Bottom */}
              <div className="flex justify-center mt-6 md:mt-8">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-white font-semibold text-sm md:text-base">
                    Common Trail
                  </div>
                  <div className="text-gray-500 text-xs">(Technical)</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Tree Tab */}
      {activeTab === 'skill-tree' && skillTreeCategories && (() => {
        const activeCategory = skillTreeCategories[activeCategoryIndex];
        if (!activeCategory?.skills) return null;
        return (
          <div className="fixed top-20 left-0 right-0 bottom-0 flex flex-col" style={{ zIndex: 15 }}>
            <SkillTreeNavigation
              categories={skillTreeCategories}
              activeIndex={activeCategoryIndex}
              onCategoryChange={setActiveCategoryIndex}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategoryIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 min-h-0 flex flex-col"
              >
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
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })()}

      {/* Skill Tree Tab - No Archetype Selected */}
      {activeTab === 'skill-tree' && !designArchetype && (
        <div className="relative w-full py-12 md:py-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-12 md:p-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Select Your Archetype First
                </h2>
                <p className="text-gray-400 text-lg mb-6">
                  Choose your design archetype to unlock your personalized skill tree
                </p>
                <button
                  onClick={() => setShowArchetypeModal(true)}
                  className="btn-primary px-8 py-3"
                >
                  Choose Archetype
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Quest Log Tab */}
      {activeTab === 'quest-log' && (
        <QuestLog
          targets={Object.values(questTargets)
            .filter((t) => t.type === 'skill' || targetRoleIds.includes(t.id))
            .sort((a, b) => {
              if (a.type === 'role' && b.type === 'skill') return -1;
              if (a.type === 'skill' && b.type === 'role') return 1;
              return 0;
            })}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onToggleTask={handleToggleTask}
          onUpdateTask={handleUpdateTask}
        />
      )}

      {/* Quest Celebration Modal */}
      {celebrationTarget && (
        <QuestCelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          targetName={celebrationTarget.name}
          targetType={celebrationTarget.type}
          onUpdateProficiency={
            celebrationTarget.type === 'skill'
              ? handleUpdateProficiencyFromCelebration
              : undefined
          }
        />
      )}

      {/* Role Modal */}
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
          onSetCurrentRole={handleSetCurrentRole}
          onSetTargetRole={handleSetTargetRole}
          onClearCurrentRole={handleClearCurrentRole}
          onClearTargetRole={handleClearTargetRole}
          onSwitchToSkillTree={() => setActiveTab('skill-tree')}
          customTimeAllocations={customTimeAllocations}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onCancel={() => {
            setShowConfirmation(false);
            setPendingCurrentRole(null);
          }}
          onConfirm={async () => {
            if (pendingCurrentRole) {
              setCurrentRoleId(pendingCurrentRole);
              const newAvailableTargets = getAvailableTargets(pendingCurrentRole);
              const updatedTargets = targetRoleIds.filter((tId) => newAvailableTargets.includes(tId) || canSetAsTarget(tId, pendingCurrentRole));
              setTargetRoleIds(updatedTargets);
              
              await updateProfile({
                current_role_id: pendingCurrentRole,
                target_role_ids: updatedTargets
              });

              setShowConfirmation(false);
              setPendingCurrentRole(null);
            }
          }}
          title="Change Current Role?"
          message="Changing your current role will update your completed roles and may clear your selected targets. Are you sure you want to proceed?"
          confirmText="Yes, Change Role"
          cancelText="Cancel"
        />
      )}

      {/* Archetype Selector Modal */}
      {showArchetypeModal && (
        <ArchetypeSelectorModal
          isOpen={showArchetypeModal}
          onClose={() => designArchetype && setShowArchetypeModal(false)}
          onComplete={handleOnboardingComplete}
          currentArchetype={designArchetype}
          currentExcludedSkillIds={excludedSkillIds}
          currentRoleId={currentRoleId}
          currentTimeAllocations={customTimeAllocations}
        />
      )}

      {/* Skill Modal */}
      {selectedSkill && (
        <SkillModal
          isOpen={!!selectedSkill}
          onClose={() => setSelectedSkill(null)}
          skill={selectedSkill}
          currentProficiency={skillProficiencies[selectedSkill.id] || 'locked'}
          onProficiencyChange={handleProficiencyChange}
          isUnlocked={currentRoleLevel >= selectedSkill.unlockAtLevel}
          targetSkillIds={targetSkillIds}
          onToggleTarget={handleToggleTarget}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}