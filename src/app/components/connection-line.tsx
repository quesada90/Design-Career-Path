import { motion } from 'motion/react';

export type ConnectionState = 'completed' | 'highlighted' | 'dim' | 'default';

interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  connectionState: ConnectionState;
}

const stateStyles: Record<ConnectionState, { opacity: number; strokeWidth: number }> = {
  completed:   { opacity: 1,    strokeWidth: 3   },
  highlighted: { opacity: 0.9,  strokeWidth: 2.5 },
  dim:         { opacity: 0.08, strokeWidth: 2   },
  default:     { opacity: 0.4,  strokeWidth: 2   },
};

export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  color,
  connectionState,
}: ConnectionLineProps) {
  const deltaY = toY - fromY;
  const controlPoint1X = fromX;
  const controlPoint1Y = fromY + deltaY * 0.3;
  const controlPoint2X = toX;
  const controlPoint2Y = toY - deltaY * 0.3;

  const path = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;
  const { opacity, strokeWidth } = stateStyles[connectionState];

  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      fill="none"
      animate={{ opacity }}
      transition={{ duration: 0.2 }}
    />
  );
}
