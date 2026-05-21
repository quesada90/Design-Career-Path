import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'lucide-react';
import { CareerNode } from './components/career-node';
import { ConnectionLine } from './components/connection-line';
import { RoleModal } from './components/role-modal';
import { SidebarLabels } from './components/sidebar-labels';
import { ConfirmationModal } from './components/confirmation-modal';
import { ArchetypeSelectorModal, type DesignArchetype, type OnboardingResult } from './components/archetype-selector-modal';
import { SkillTreeNavigation } from './components/skill-tree-navigation';
import { SkillForceGraph } from './components/skill-force-graph';
import { SkillModal } from './components/skill-modal';
import { QuestLog } from './components/quest-log';
import { QuestCelebrationModal } from './components/quest-celebration-modal';
import { careerRoles, type CareerRole } from './components/career-data';
import { getRoleState, canSetAsTarget, getAvailableTargets } from './utils/career-path-logic';
import {
  getSkillsForArchetype,
  getAllSkillsForArchetype,
  getRoleLevelFromId,
  type Skill,
  type SkillProficiency,
} from './data/skills-data';
import type { QuestTargets, QuestTarget, QuestTask } from './types/quest-log';
import { createNewTask, generateTaskId } from './types/quest-log';
import type { TimeAllocation } from './data/time-allocation-data';

const SKILL_CATEGORY_COUNT = 4;

type ActiveTab = 'career-path' | 'skill-tree' | 'quest-log';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<CareerRole | null>(null);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 1000 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('career-path');

  // Skill Tree Navigation State
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Reset active category index if it's out of bounds
  useEffect(() => {
    if (activeCategoryIndex >= SKILL_CATEGORY_COUNT) {
      setActiveCategoryIndex(0);
    }
  }, [activeCategoryIndex]);

  // Archetype state with localStorage persistence
  const [designArchetype, setDesignArchetype] = useState<DesignArchetype | null>(() => {
    const saved = localStorage.getItem('designArchetype');
    return saved as DesignArchetype | null;
  });

  const [excludedSkillIds, setExcludedSkillIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('excludedSkillIds') || '[]'); } catch { return []; }
  });

  const [customTimeAllocations, setCustomTimeAllocations] = useState<Record<string, TimeAllocation>>(() => {
    try { return JSON.parse(localStorage.getItem('customTimeAllocations') || '{}'); } catch { return {}; }
  });

  const [showArchetypeModal, setShowArchetypeModal] = useState(false);

  // Show archetype selector on first load
  useEffect(() => {
    if (!designArchetype) {
      setShowArchetypeModal(true);
    }
  }, [designArchetype]);

  // Persist archetype to localStorage
  useEffect(() => {
    if (designArchetype) {
      localStorage.setItem('designArchetype', designArchetype);
    }
  }, [designArchetype]);

  useEffect(() => {
    localStorage.setItem('excludedSkillIds', JSON.stringify(excludedSkillIds));
  }, [excludedSkillIds]);

  useEffect(() => {
    localStorage.setItem('customTimeAllocations', JSON.stringify(customTimeAllocations));
  }, [customTimeAllocations]);

  const handleOnboardingComplete = (result: OnboardingResult) => {
    const newArchetypeSkills = getAllSkillsForArchetype(result.archetype);
    const validSkillIds = new Set(newArchetypeSkills.map((s) => s.id));

    // Remove excluded IDs that no longer exist in the new archetype
    setExcludedSkillIds(result.excludedSkillIds.filter((id) => validSkillIds.has(id)));

    // Prune proficiencies: keep skills that exist in the new archetype (shared + craft)
    setSkillProficiencies((prev) => {
      const pruned: Record<string, SkillProficiency> = {};
      for (const [id, prof] of Object.entries(prev)) {
        if (validSkillIds.has(id)) pruned[id] = prof;
      }
      return pruned;
    });

    // Prune target skill IDs that no longer exist
    setTargetSkillIds((prev) => prev.filter((id) => validSkillIds.has(id)));

    setDesignArchetype(result.archetype);
    setCustomTimeAllocations(result.customTimeAllocations);
    if (result.currentRoleId) {
      setCurrentRoleId(result.currentRoleId);
    }
    setActiveCategoryIndex(0);
    setShowArchetypeModal(false);
  };

  // Career path state with localStorage persistence (MOVED UP - needs to be declared before use)
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(() => {
    const saved = localStorage.getItem('currentRoleId');
    return saved || null;
  });
  
  const [targetRoleIds, setTargetRoleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('targetRoleIds');
    return saved ? JSON.parse(saved) : [];
  });

  // Skill Tree state with localStorage persistence
  const [skillProficiencies, setSkillProficiencies] = useState<Record<string, SkillProficiency>>(() => {
    const saved = localStorage.getItem('skillProficiencies');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  // Target skills state with localStorage persistence
  const [targetSkillIds, setTargetSkillIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('targetSkillIds');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist skill proficiencies to localStorage
  useEffect(() => {
    localStorage.setItem('skillProficiencies', JSON.stringify(skillProficiencies));
  }, [skillProficiencies]);

  // Persist target skills to localStorage
  useEffect(() => {
    localStorage.setItem('targetSkillIds', JSON.stringify(targetSkillIds));
  }, [targetSkillIds]);

  // Quest Log state with localStorage persistence
  const [questTargets, setQuestTargets] = useState<QuestTargets>(() => {
    const saved = localStorage.getItem('questTargets');
    return saved ? JSON.parse(saved) : {};
  });

  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTarget, setCelebrationTarget] = useState<{ id: string; name: string; type: 'role' | 'skill' } | null>(null);

  // Persist quest targets to localStorage
  useEffect(() => {
    localStorage.setItem('questTargets', JSON.stringify(questTargets));
  }, [questTargets]);

  // Handle skill proficiency change
  const handleProficiencyChange = (skillId: string, proficiency: SkillProficiency) => {
    setSkillProficiencies((prev) => ({
      ...prev,
      [skillId]: proficiency,
    }));
    
    // Automatically remove from targets when proficiency is set
    if (proficiency !== 'locked') {
      setTargetSkillIds((prev) => prev.filter((id) => id !== skillId));
    }
  };

  // Handle target skill toggle
  const handleToggleTarget = (skillId: string) => {
    setTargetSkillIds((prev) => {
      const isRemoving = prev.includes(skillId);

      // Remove from quest targets if removing
      if (isRemoving) {
        setQuestTargets((questPrev) => {
          const newTargets = { ...questPrev };
          delete newTargets[skillId];
          return newTargets;
        });
        return prev.filter((id) => id !== skillId);
      } else {
        // Add to targets
        return [...prev, skillId];
      }
    });
  };

  // Get current role level for skill unlocking
  const currentRoleLevel = getRoleLevelFromId(currentRoleId);

  // Get current role color for skill tree
  const currentRole = careerRoles.find((r) => r.id === currentRoleId);
  const roleColor = currentRole?.color || '#06b6d4'; // Default to cyan

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingCurrentRole, setPendingCurrentRole] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    if (currentRoleId) {
      localStorage.setItem('currentRoleId', currentRoleId);
    } else {
      localStorage.removeItem('currentRoleId');
    }
  }, [currentRoleId]);

  useEffect(() => {
    localStorage.setItem('targetRoleIds', JSON.stringify(targetRoleIds));
  }, [targetRoleIds]);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    const timeoutId = setTimeout(updateSize, 100); // Delay for initial render
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

  // Close modal when switching tabs to ensure fresh data on reopen
  useEffect(() => {
    if (selectedRole) {
      setSelectedRole(null);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle setting current role with confirmation if already set
  const handleSetCurrentRole = (roleId: string) => {
    if (currentRoleId === null) {
      // First time setting - no confirmation needed
      setCurrentRoleId(roleId);
      // Clear targets that are no longer reachable
      const newAvailableTargets = getAvailableTargets(roleId);
      setTargetRoleIds((prev) =>
        prev.filter((tId) => newAvailableTargets.includes(tId) || canSetAsTarget(tId, roleId))
      );
    } else {
      // Already have a current role - show confirmation
      setPendingCurrentRole(roleId);
      setShowConfirmation(true);
    }
  };

  // Handle setting target role
  const handleSetTargetRole = (roleId: string) => {
    if (!canSetAsTarget(roleId, currentRoleId)) {
      return; // Invalid target
    }
    
    // Only one target at a time
    setTargetRoleIds([roleId]);
  };

  // Handle clearing current role
  const handleClearCurrentRole = () => {
    setCurrentRoleId(null);
    setTargetRoleIds([]);
  };

  // Handle clearing target role
  const handleClearTargetRole = (roleId: string) => {
    setTargetRoleIds((prev) => prev.filter((id) => id !== roleId));
    // Remove quest target when role target is cleared
    setQuestTargets((prev) => {
      const newTargets = { ...prev };
      delete newTargets[roleId];
      return newTargets;
    });
  };

  // Quest Log handlers
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

  // Sync quest targets with actual targets (role + skills)
  useEffect(() => {
    setQuestTargets((prev) => {
      const newTargets: QuestTargets = { ...prev };

      // Add target role if it doesn't exist
      if (targetRoleIds.length > 0) {
        const roleId = targetRoleIds[0];
        const role = careerRoles.find((r) => r.id === roleId);
        if (role && !newTargets[roleId]) {
          newTargets[roleId] = {
            id: roleId,
            type: 'role',
            name: role.title,
            tasks: createExampleTasks(roleId, 'role', role.title),
          };
        }
      }

      // Add target skills if they don't exist
      targetSkillIds.forEach((skillId) => {
        if (!newTargets[skillId] && designArchetype) {
          const skills = getSkillsForArchetype(designArchetype);
          const allSkills = [...skills.craft, ...skills.communication, ...skills.leadership, ...skills.business];
          const skill = allSkills.find((s) => s.id === skillId);
          if (skill) {
            newTargets[skillId] = {
              id: skillId,
              type: 'skill',
              name: skill.name,
              tasks: createExampleTasks(skillId, 'skill', skill.name),
            };
          }
        }
      });

      // Remove quest targets that are no longer targeted
      Object.keys(newTargets).forEach((targetId) => {
        const isRole = newTargets[targetId].type === 'role';
        const isStillTargeted = isRole
          ? targetRoleIds.includes(targetId)
          : targetSkillIds.includes(targetId);

        if (!isStillTargeted) {
          delete newTargets[targetId];
        }
      });

      return newTargets;
    });
  }, [targetRoleIds, targetSkillIds, designArchetype]);

  const handleAddTask = (targetId: string) => {
    setQuestTargets((prev) => {
      const target = prev[targetId];
      if (!target) return prev;

      return {
        ...prev,
        [targetId]: {
          ...target,
          tasks: [...target.tasks, createNewTask()],
        },
      };
    });
  };

  const handleDeleteTask = (targetId: string, taskId: string) => {
    setQuestTargets((prev) => {
      const target = prev[targetId];
      if (!target) return prev;

      return {
        ...prev,
        [targetId]: {
          ...target,
          tasks: target.tasks.filter((t) => t.id !== taskId),
        },
      };
    });
  };

  const handleToggleTask = (targetId: string, taskId: string) => {
    let completedTarget: { id: string; type: 'role' | 'skill' } | null = null;

    setQuestTargets((prev) => {
      const target = prev[targetId];
      if (!target) return prev;

      const updatedTasks = target.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );

      const allComplete = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
      if (allComplete) {
        completedTarget = { id: targetId, type: target.type };
      }

      return { ...prev, [targetId]: { ...target, tasks: updatedTasks } };
    });

    // Fire celebration after state is committed — no stale closure risk
    if (completedTarget) {
      const { id, type } = completedTarget as { id: string; type: 'role' | 'skill' };
      handleTargetCompleted(id, type);
    }
  };

  const handleUpdateTask = (
    targetId: string,
    taskId: string,
    field: keyof QuestTask,
    value: string | boolean
  ) => {
    setQuestTargets((prev) => {
      const target = prev[targetId];
      if (!target) return prev;

      return {
        ...prev,
        [targetId]: {
          ...target,
          tasks: target.tasks.map((t) =>
            t.id === taskId ? { ...t, [field]: value } : t
          ),
        },
      };
    });
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
      // Find the skill and open its modal
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
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Career Path
                </button>
                <button
                  onClick={() => setActiveTab('skill-tree')}
                  className={`px-3 md:px-5 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-300 ${
                    activeTab === 'skill-tree'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Skill Tree
                </button>
                <button
                  onClick={() => setActiveTab('quest-log')}
                  className={`px-3 md:px-5 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-300 ${
                    activeTab === 'quest-log'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Quest Log
                </button>
              </div>
            </motion.nav>

            {/* Right: Profile Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <button
                onClick={() => setShowArchetypeModal(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 transition-all duration-300 group"
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
          <div className="relative w-full px-24 md:px-40 overflow-x-auto">
            <div className="relative w-full min-w-[600px] max-w-5xl mx-auto">
              
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
                {/* Left Sidebar - Absolute positioning */}
                <div className="absolute left-0 top-0 bottom-0 -ml-24 md:-ml-36">
                  <SidebarLabels position="left" />
                </div>

                {/* Right Sidebar - Absolute positioning */}
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

                      // Calculate pixel positions and add offset for dot center
                      // Dots are w-4 h-4 (16px) on mobile, w-5 h-5 (20px) on desktop
                      // Average ~18px, so radius offset is ~9px (but we'll calculate it properly)
                      const dotRadius = 10; // Approximate center offset in pixels
                      
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
      {activeTab === 'skill-tree' && designArchetype && (() => {
        const excludedSet = new Set(excludedSkillIds);
        const filterSkills = (list: import('./data/skills-data').Skill[]) => list.filter((s) => !excludedSet.has(s.id));
        const raw = getSkillsForArchetype(designArchetype);
        const categories = [
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

        // Safety check: ensure we have a valid category
        if (!activeCategory || !activeCategory.skills) {
          return null;
        }

        return (
          <div className="relative w-full min-h-[calc(100vh-80px)]">
            {/* Navigation */}
            <SkillTreeNavigation
              categories={categories}
              activeIndex={activeCategoryIndex}
              onCategoryChange={setActiveCategoryIndex}
            />

            {/* Active Category Content with Animation */}
            {/* Add padding: bottom for mobile nav (80px), desktop keyboard hints (60px) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategoryIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="h-full pb-20 md:pb-16"
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
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 font-medium shadow-lg"
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
          targets={Object.values(questTargets).sort((a, b) => {
            // Role always comes first, then skills
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
          onConfirm={() => {
            if (pendingCurrentRole) {
              setCurrentRoleId(pendingCurrentRole);
              // Clear targets that are no longer reachable
              const newAvailableTargets = getAvailableTargets(pendingCurrentRole);
              setTargetRoleIds((prev) =>
                prev.filter((tId) => newAvailableTargets.includes(tId) || canSetAsTarget(tId, pendingCurrentRole))
              );
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
    </div>
  );
}