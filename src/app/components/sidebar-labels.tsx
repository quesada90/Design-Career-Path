import { motion } from 'motion/react';
import { levelYPositions } from '../config/career-levels';
import { LEVEL_COLORS } from '../config/tokens';

interface SidebarLabelsProps {
  position: 'left' | 'right';
}

// Define labels for each level (bottom to top)
// Labels are defined in ascending level order (0 = bottom, 7 = top)
const leftSidebarLabels = [
  { level: 0, text: 'SUBTASK' },
  { level: 1, text: 'TASK' },
  { level: 2, text: 'FEATURE' },
  { level: 3, text: 'TEAM' },
  { level: 4, text: 'PILAR' },
  { level: 5, text: 'ORGANIZATION' },
  { level: 6, text: 'COMPANY-WIDE' },
  { level: 7, text: 'INDUSTRY' },
];

const rightSidebarLabels = [
  { level: 0, text: 'SUPERVISED' },
  { level: 1, text: 'EXECUTES' },
  { level: 2, text: 'EXECUTES +' },
  { level: 3, text: 'PROPOSES' },
  { level: 4, text: 'ADVISES' },
  { level: 5, text: 'DECIDES' },
  { level: 6, text: 'DEFINES' },
  { level: 7, text: 'DEFINES' },
];

export function SidebarLabels({ position }: SidebarLabelsProps) {
  // Select labels based on sidebar position
  const labelData = position === 'left' ? leftSidebarLabels : rightSidebarLabels;
  
  // Map labels with their calculated Y positions from config
  const labels = labelData.map((label) => ({
    ...label,
    color: LEVEL_COLORS[label.level] ?? '#ffffff',
    y: levelYPositions[label.level],
  }));

  const sidebarTitle = position === 'left' ? 'Impact Scope' : 'Autonomy & Decision Authority';

  return (
    <div className="relative h-full w-24 md:w-36">
      {/* Vertical Title */}
      <div
        className={`absolute top-1/2 ${position === 'left' ? 'left-0' : 'right-0'}`}
        style={{
          writingMode: 'vertical-lr',
          textOrientation: 'mixed',
          transform: 'translateY(-50%) rotate(180deg)',
        }}
      >
        <span className="text-white font-semibold text-xs md:text-sm tracking-wider">
          {sidebarTitle}
        </span>
      </div>

      {/* Labels */}
      {labels.map((label, index) => (
        <motion.div
          key={label.level}
          className={`absolute flex items-center gap-2 ${
            position === 'left' ? 'flex-row left-8 md:left-10' : 'flex-row left-8 md:left-10'
          }`}
          style={{ 
            top: `${label.y}%`, 
            transform: 'translateY(-50%)'
          }}
          initial={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
        >
          <div
            className="w-1 h-6 md:h-8 rounded-full flex-shrink-0"
            style={{
              backgroundColor: label.color,
              boxShadow: `0 0 10px ${label.color}60`,
            }}
          />
          <span
            className="text-[8px] md:text-xs font-medium leading-tight text-left"
            style={{ color: label.color }}
          >
            {label.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
