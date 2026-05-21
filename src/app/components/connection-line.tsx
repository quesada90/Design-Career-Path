import { motion } from 'motion/react';

interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  isHighlighted?: boolean;
}

export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  color,
  isHighlighted = false,
}: ConnectionLineProps) {
  // Calculate control points for a smooth curve
  // For vertical orientation, we want curves that flow naturally upward/sideways
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const midY = (fromY + toY) / 2;
  
  // Use bezier curves for more natural flow
  const controlPoint1X = fromX + deltaX * 0.2;
  const controlPoint1Y = fromY;
  const controlPoint2X = toX - deltaX * 0.2;
  const controlPoint2Y = toY;

  const path = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;

  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth={isHighlighted ? 3 : 2}
      strokeDasharray="6 4"
      fill="none"
      opacity={isHighlighted ? 1 : 0.4}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: isHighlighted ? 1 : 0.4 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="transition-all duration-300"
    />
  );
}