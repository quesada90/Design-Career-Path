import { motion } from 'motion/react';
import { Check, Target } from 'lucide-react';
import type { RoleState } from '../utils/career-path-logic';

interface CareerNodeProps {
  id: string;
  title: string;
  level: number;
  track: 'single' | 'ic' | 'management';
  color: string;
  x: number;
  y: number;
  onClick: () => void;
  isActive?: boolean;
  roleState: RoleState;
}

export function CareerNode({
  id,
  title,
  level,
  track,
  color,
  x,
  y,
  onClick,
  isActive = false,
  roleState,
}: CareerNodeProps) {
  const isICTrack = track === 'ic';

  const getNodeStyles = () => {
    switch (roleState) {
      case 'completed':
        return {
          bg: color,
          border: color,
          borderWidth: '2px',
          scale: 1,
          showIcon: 'check' as const,
        };
      case 'current':
        return {
          bg: '#ffffff',
          border: `${color}80`,
          borderWidth: '4px',
          scale: 1.3,
          showIcon: null,
        };
      case 'target':
        return {
          bg: 'transparent',
          border: color,
          borderWidth: '2px',
          borderStyle: 'dashed',
          scale: 1.1,
          showIcon: 'target' as const,
        };
      case 'future':
      default:
        return {
          bg: '#374151',
          border: '#6B7280',
          borderWidth: '2px',
          scale: 1,
          showIcon: null,
        };
    }
  };

  const styles = getNodeStyles();
  const showHoverRing = isActive && roleState !== 'current';

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        left: `calc(${x}% - 8px)`,
        top: `calc(${y}% - 8px)`,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.2, transition: { duration: 0.1 } }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: level * 0.05 }}
    >
      {/* Main node circle */}
      <div
        className="relative w-4 h-4 md:w-5 md:h-5 rounded-full transition-all duration-200 flex items-center justify-center"
        style={{
          backgroundColor: styles.bg,
          borderColor: showHoverRing ? `${color}80` : styles.border,
          borderWidth: showHoverRing ? '4px' : styles.borderWidth,
          borderStyle: styles.borderStyle || 'solid',
          transform: `scale(${styles.scale})`,
        }}
      >
        {styles.showIcon === 'check' && (
          <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" strokeWidth={3} />
        )}
        {styles.showIcon === 'target' && (
          <Target className="w-2.5 h-2.5 md:w-3 md:h-3" style={{ color }} strokeWidth={2.5} />
        )}
      </div>

      {/* Title label */}
      <motion.div
        className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs md:text-sm font-medium pointer-events-none ${
          isICTrack
            ? 'right-full mr-3 md:mr-4'
            : 'left-full ml-3 md:ml-4'
        }`}
        style={{ color }}
        initial={{ opacity: 0, x: isICTrack ? 10 : -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.05 + 0.1 }}
      >
        {title}
      </motion.div>
    </motion.div>
  );
}
