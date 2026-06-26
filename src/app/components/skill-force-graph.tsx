import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';
import type { Skill, SkillProficiency } from '../data/skills-data';
import {
  CATEGORY_COLORS,
  SKILL_NODE_COLORS,
  CANVAS_BG,
  CANVAS_TEXT_COLOR,
  LINK_COLOR_BASE,
  LINK_COLOR_TARGET,
  PARTICLE_SPEED_MIN,
  PARTICLE_SPEED_MAX,
  PARTICLE_LIFE_MIN,
  PARTICLE_LIFE_MAX,
  PARTICLE_SIZE_MIN,
  PARTICLE_SIZE_MAX,
  PARTICLE_EMIT_COUNT,
} from '../config/tokens';

interface SkillForceGraphProps {
  skills: Skill[];
  skillProficiencies: Record<string, SkillProficiency>;
  targetSkillIds: string[];
  currentRoleLevel: number;
  onSkillClick: (skill: Skill) => void;
  categoryName: string;
  categoryDescription: string;
  color: string;
}

interface GraphNode {
  id: string;
  name: string;
  skill: Skill;
  proficiency: SkillProficiency;
  isUnlocked: boolean;
  isTarget: boolean;
  level: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

// After force-graph resolves links, source/target become node objects
interface ResolvedGraphLink {
  source: GraphNode | string;
  target: GraphNode | string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function SkillForceGraph({
  skills,
  skillProficiencies,
  targetSkillIds,
  currentRoleLevel,
  onSkillClick,
  categoryName,
  categoryDescription,
  color,
}: SkillForceGraphProps) {
  // react-force-graph-2d doesn't export a ref type — any is the intended workaround
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const previousProficienciesRef = useRef<Record<string, SkillProficiency>>({});
  const previousRoleLevelRef = useRef<number>(currentRoleLevel);

  // Calculate statistics
  const unlockedSkills = skills.filter((s) => currentRoleLevel >= s.unlockAtLevel);
  const masteredSkills = skills.filter((s) => skillProficiencies[s.id] === 'master').length;
  const experienceSkills = skills.filter((s) => skillProficiencies[s.id] === 'experience').length;
  const knownSkills = skills.filter((s) => skillProficiencies[s.id] === 'know').length;
  const targetSkillsCount = skills.filter((s) => targetSkillIds.includes(s.id)).length;
  const totalProgress = masteredSkills + experienceSkills + knownSkills;
  const progressPercentage = unlockedSkills.length > 0 ? (totalProgress / unlockedSkills.length) * 100 : 0;

  // Particle system: create particles around a node
  const emitParticles = useCallback((node: GraphNode, particleColor: string, count: number = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = PARTICLE_SPEED_MIN + Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN);
      newParticles.push({
        x: node.x!,
        y: node.y!,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: PARTICLE_LIFE_MIN + Math.random() * (PARTICLE_LIFE_MAX - PARTICLE_LIFE_MIN),
        color: particleColor,
        size: PARTICLE_SIZE_MIN + Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN),
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('force-graph-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(820, window.innerHeight - 145),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Detect proficiency changes and emit particles
  useEffect(() => {
    Object.keys(skillProficiencies).forEach((skillId) => {
      const currentProf = skillProficiencies[skillId];
      const previousProf = previousProficienciesRef.current[skillId];

      if (previousProf && previousProf !== currentProf && currentProf !== 'locked') {
        // Proficiency changed - emit particles
        const skill = skills.find(s => s.id === skillId);
        if (skill && graphData.nodes.length > 0) {
          const node = graphData.nodes.find(n => n.id === skillId);
          if (node && node.x !== undefined && node.y !== undefined) {
            const color = getNodeColor(node);
            emitParticles(node, color, 15);
          }
        }
      }
    });
    previousProficienciesRef.current = { ...skillProficiencies };
  }, [skillProficiencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect role level changes and emit particles for newly unlocked skills
  useEffect(() => {
    if (previousRoleLevelRef.current < currentRoleLevel) {
      // Level increased - find newly unlocked skills
      skills.forEach((skill) => {
        const wasLocked = previousRoleLevelRef.current < skill.unlockAtLevel;
        const isNowUnlocked = currentRoleLevel >= skill.unlockAtLevel;

        if (wasLocked && isNowUnlocked && graphData.nodes.length > 0) {
          const node = graphData.nodes.find(n => n.id === skill.id);
          if (node && node.x !== undefined && node.y !== undefined) {
            emitParticles(node, CATEGORY_COLORS.craft, PARTICLE_EMIT_COUNT);
          }
        }
      });
    }
    previousRoleLevelRef.current = currentRoleLevel;
  }, [currentRoleLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Particle animation loop
  useEffect(() => {
    let animationFrameId: number;

    const updateParticles = () => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life + 1,
          vy: p.vy + 0.02, // Gravity
        }))
        .filter((p) => p.life < p.maxLife);

      animationFrameId = requestAnimationFrame(updateParticles);
    };

    updateParticles();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Transform skills into graph data with level-based initial positioning
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = skills.map((skill) => {
      const isUnlocked = currentRoleLevel >= skill.unlockAtLevel;
      const proficiency = skillProficiencies[skill.id] || 'locked';
      const isTarget = targetSkillIds.includes(skill.id);

      // Level-based vertical positioning (Option C)
      // Level 0 at top (y=100), Level 7 at bottom (y=700)
      // Horizontal spread within level
      const levelY = 100 + (skill.unlockAtLevel * 100);
      const levelX = dimensions.width / 2 + (Math.random() - 0.5) * 300;

      return {
        id: skill.id,
        name: skill.name,
        skill,
        proficiency,
        isUnlocked,
        isTarget,
        level: skill.unlockAtLevel,
        x: levelX,
        y: levelY,
      };
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = [];
    skills.forEach((skill) => {
      skill.connections.forEach((connId) => {
        if (nodeIds.has(connId)) {
          links.push({ source: skill.id, target: connId });
        }
      });
    });

    return { nodes, links };
  }, [skills, skillProficiencies, targetSkillIds, currentRoleLevel, dimensions.width]);

  // Node color based on proficiency state
  const getNodeColor = (node: GraphNode) => {
    if (!node.isUnlocked) return SKILL_NODE_COLORS.locked;
    if (node.isTarget && node.proficiency === 'locked') return SKILL_NODE_COLORS.target;

    switch (node.proficiency) {
      case 'know':       return SKILL_NODE_COLORS.know;
      case 'experience': return SKILL_NODE_COLORS.experience;
      case 'master':     return SKILL_NODE_COLORS.master;
      default:           return CATEGORY_COLORS.craft; // Cyan for unlocked
    }
  };

  // Node size based on state
  const getNodeSize = (node: GraphNode) => {
    if (!node.isUnlocked) return 4;
    if (node.isTarget) return 8;
    if (node.proficiency !== 'locked') return 7;
    return 6;
  };

  // Handle node drag - pin nodes (Option A)
  const handleNodeDrag = useCallback((node: GraphNode) => {
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    onSkillClick(node.skill);
  }, [onSkillClick]);

  // Zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400);
    }
  };

  const handleZoomFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  // Filter nodes by search
  const filteredData = useMemo(() => {
    if (!searchTerm) return graphData;

    const matchingIds = new Set(
      graphData.nodes
        .filter(node => node.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(node => node.id)
    );

    return {
      nodes: graphData.nodes,
      links: graphData.links.filter(link =>
        matchingIds.has(link.source as string) || matchingIds.has(link.target as string)
      ),
    };
  }, [graphData, searchTerm]);

  // Node canvas rendering
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = getNodeSize(node);
    const nodeColor = getNodeColor(node);
    const isHighlighted = hoveredNode?.id === node.id;
    const isConnected = hoveredNode && graphData.links.some(
      link => {
        const resolved = link as unknown as ResolvedGraphLink;
        const sourceId = typeof resolved.source === 'object' ? resolved.source.id : resolved.source;
        const targetId = typeof resolved.target === 'object' ? resolved.target.id : resolved.target;
        return (
          (sourceId === hoveredNode.id && targetId === node.id) ||
          (targetId === hoveredNode.id && sourceId === node.id)
        );
      }
    );

    // Determine if this node should be dimmed
    const shouldDim = hoveredNode && !isHighlighted && !isConnected;
    const nodeOpacity = shouldDim ? 0.15 : 1;

    // Save context state
    ctx.save();
    ctx.globalAlpha = nodeOpacity;

    // Glow effect for highlighted/connected nodes
    if (isHighlighted || isConnected) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size + 4, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor + '40';
      ctx.fill();
    }

    // Main node
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
    ctx.fillStyle = nodeColor;
    ctx.fill();

    // Border
    ctx.strokeStyle = isHighlighted ? CANVAS_TEXT_COLOR : nodeColor;
    ctx.lineWidth = isHighlighted ? 2 : 1;
    if (node.isTarget) {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();

    // Label (always show)
    ctx.font = `${12 / globalScale}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = CANVAS_TEXT_COLOR;
    ctx.fillText(node.name, node.x!, node.y! + size + 4);

    // Restore context state
    ctx.restore();
  }, [hoveredNode, graphData.links]);

  // Link canvas rendering with fading (Option D)
  const paintLink = useCallback((link: { source: GraphNode; target: GraphNode }, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const sourceNode = graphData.nodes.find(n => n.id === link.source.id);
    const targetNode = graphData.nodes.find(n => n.id === link.target.id);

    if (!sourceNode || !targetNode) return;

    const isHighlighted = hoveredNode &&
      (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id);

    const isUnlocked = sourceNode.isUnlocked && targetNode.isUnlocked;

    // Dim unrelated links when hovering
    let opacity: number;
    if (hoveredNode) {
      opacity = isHighlighted ? 0.8 : 0.05; // Highlighted or very dim
    } else {
      opacity = isUnlocked ? 0.3 : 0.15; // Default behavior
    }

    const width = isHighlighted ? 2 : 1;

    ctx.beginPath();
    ctx.moveTo(link.source.x || 0, link.source.y || 0);
    ctx.lineTo(link.target.x || 0, link.target.y || 0);
    ctx.strokeStyle = isUnlocked
      ? `${LINK_COLOR_BASE} ${opacity})`
      : `${LINK_COLOR_TARGET} ${opacity})`;
    ctx.lineWidth = width;
    if (!isUnlocked) {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
  }, [hoveredNode, graphData.nodes]);

  // Particle canvas ref
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);

  // Cluster labels based on skill levels
  const clusterLabels = useMemo(() => {
    const labels: Array<{ level: number; label: string; y: number }> = [
      { level: 0, label: 'Foundation', y: 100 },
      { level: 2, label: 'Core Skills', y: 300 },
      { level: 4, label: 'Advanced', y: 500 },
      { level: 6, label: 'Expert', y: 700 },
    ];

    // Only show labels for levels that have skills
    return labels.filter(({ level }) =>
      skills.some(s => s.unlockAtLevel >= level && s.unlockAtLevel < level + 2)
    );
  }, [skills]);

  // Render particles on canvas overlay
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderParticles = () => {
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw particles
      particlesRef.current.forEach((particle) => {
        const opacity = Math.max(0, 1 - particle.life / particle.maxLife);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(renderParticles);
    };

    renderParticles();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="w-full pb-20 md:pb-6">
      {/* Header */}
      <motion.div
        className="px-4 md:px-8 py-6 border-b border-slate-800/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{categoryName}</h2>
          <p className="text-gray-400 text-sm md:text-base mb-4">{categoryDescription}</p>

          {/* Stats */}
          <div className="flex items-center gap-3 md:gap-6 mb-3 flex-wrap text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Unlocked:</span>
              <span className="font-semibold text-cyan-400">{unlockedSkills.length} / {skills.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Progress:</span>
              <span className="font-semibold text-purple-400">{totalProgress} / {unlockedSkills.length}</span>
            </div>
            {targetSkillsCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Targets:</span>
                <span className="font-semibold text-orange-400">{targetSkillsCount}</span>
              </div>
            )}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-gray-400">{masteredSkills} Master</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-400">{experienceSkills} Exp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-400">{knownSkills} Know</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Graph Container */}
      <div className="relative" id="force-graph-container">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-sm w-40 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomFit}
            className="w-10 h-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
            title="Fit to screen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Force Graph */}
        <ForceGraph2D
          ref={graphRef}
          // react-force-graph-2d's generic NodeObject doesn't align with our typed GraphNode — cast required
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          graphData={filteredData as any}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={CANVAS_BG}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          nodeLabel={() => ''} // Disable built-in tooltip
          onNodeClick={handleNodeClick}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDrag}
          onNodeHover={(node) => setHoveredNode(node as GraphNode | null)}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePointerInteraction={true}
          cooldownTime={3000} // Option B: Run until stable
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />

        {/* Particle Canvas Overlay */}
        <canvas
          ref={particleCanvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ zIndex: 10 }}
        />

        {/* Cluster Labels */}
        {clusterLabels.map(({ level, label, y }) => (
          <motion.div
            key={level}
            className="absolute left-4 pointer-events-none"
            style={{
              top: `${y}px`,
              zIndex: 5,
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.4, x: 0 }}
            transition={{ delay: 0.5 + level * 0.1 }}
          >
            <div className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
              {label}
            </div>
          </motion.div>
        ))}

        {/* Minimap */}
        <div className="absolute bottom-4 right-4 z-10">
            <div className="w-32 h-32 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Simplified minimap representation */}
                {graphData.nodes.map(node => (
                  <circle
                    key={node.id}
                    cx={((node.x || 0) / dimensions.width) * 100}
                    cy={((node.y || 0) / dimensions.height) * 100}
                    r="2"
                    fill={getNodeColor(node)}
                    opacity="0.6"
                  />
                ))}
              </svg>
            </div>
          </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-400">
            <p>🖱️ Drag to pan • Scroll to zoom • Click skill for details</p>
            <p>💡 Drag nodes to pin them in place</p>
          </div>
        </div>
      </div>
    </div>
  );
}
