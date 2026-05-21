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
  // IC track shows text on left (text - dot)
  const isICTrack = track === 'ic';
  
  // Visual styles based on role state
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
          border: '#ffffff',
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
  
  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        left: `calc(${x}% - 8px)`,
        top: `calc(${y}% - 8px)`,
      }}
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: level * 0.1 }}
    >
      {/* Glow effect - stronger for current role */}
      {roleState === 'current' && (
        <motion.div
          className="absolute inset-0 rounded-full blur-lg"
          style={{ backgroundColor: '#ffffff' }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      <motion.div
        className="absolute inset-0 rounded-full blur-md"
        style={{ backgroundColor: roleState === 'current' ? '#ffffff' : color }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.4 }}
        animate={{ opacity: isActive ? 0.6 : 0 }}
      />

      {/* Main node circle */}
      <div
        className="relative w-4 h-4 md:w-5 md:h-5 rounded-full transition-all duration-300 flex items-center justify-center"
        style={{
          backgroundColor: styles.bg,
          borderColor: styles.border,
          borderWidth: styles.borderWidth,
          borderStyle: styles.borderStyle || 'solid',
          transform: `scale(${styles.scale})`,
          boxShadow: roleState === 'current' ? '0 0 20px rgba(255,255,255,0.8)' : 'none',
        }}
      >
        {/* Icons */}
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
        transition={{ delay: level * 0.1 + 0.2 }}
      >
        {title}
      </motion.div>
    </motion.div>
  );
}