import { useEffect } from 'react';
import { motion } from 'motion/react';

interface CategoryData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface SkillTreeNavigationProps {
  categories: CategoryData[];
  activeIndex: number;
  onCategoryChange: (index: number) => void;
}

export function SkillTreeNavigation({
  categories,
  activeIndex,
  onCategoryChange,
}: SkillTreeNavigationProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Number keys 1-4
      if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (index < categories.length) {
          onCategoryChange(index);
        }
      }
      // Arrow keys
      if (e.key === 'ArrowLeft') {
        onCategoryChange(activeIndex > 0 ? activeIndex - 1 : categories.length - 1);
      }
      if (e.key === 'ArrowRight') {
        onCategoryChange(activeIndex < categories.length - 1 ? activeIndex + 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeIndex, categories.length, onCategoryChange]);

  // Extract just emoji from name (assumes format "🎨 Craft")
  const getEmoji = (name: string) => name.split(' ')[0];
  const getLabel = (name: string) => name.split(' ').slice(1).join(' ');

  // TOP TABS LAYOUT (Desktop & Tablet)
  return (
    <>
      {/* Desktop/Tablet: Top Tabs */}
      <nav
        role="navigation"
        aria-label="Skill category navigation"
        className="hidden md:flex z-20 items-center justify-center gap-1 px-4 py-2 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 flex-shrink-0"
      >
        {categories.map((category, index) => {
            const isActive = activeIndex === index;

            return (
              <motion.button
                key={index}
                onClick={() => onCategoryChange(index)}
                className={`
                  relative px-4 py-1.5 rounded-lg
                  flex items-center gap-2
                  text-sm font-medium transition-all duration-300
                  ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-slate-800/50 hover:text-gray-200'
                  }
                  border
                `}
                style={{
                  borderColor: isActive ? category.color : 'transparent',
                  boxShadow: isActive
                    ? `0 0 16px ${category.color}30`
                    : undefined,
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                aria-label={`${getLabel(category.name)} skills`}
                aria-pressed={isActive}
              >
                {/* Icon */}
                <span className="text-base leading-none">{getEmoji(category.name)}</span>

                {/* Label */}
                <span>{getLabel(category.name)}</span>

                {/* Keyboard shortcut hint */}
                <kbd
                  className={`ml-1 px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
                    isActive
                      ? 'bg-slate-700 text-gray-300'
                      : 'bg-slate-800/50 text-gray-500'
                  }`}
                >
                  {index + 1}
                </kbd>

                {/* Active indicator pulse */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ border: `1px solid ${category.color}` }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.button>
            );
          })}
      </nav>

      {/* Mobile: Bottom Navigation Bar */}
      <nav
        role="navigation"
        aria-label="Skill category navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800"
      >
        <div className="grid grid-cols-3 gap-0">
          {categories.map((category, index) => {
            const isActive = activeIndex === index;

            return (
              <motion.button
                key={index}
                onClick={() => onCategoryChange(index)}
                className={`
                  relative py-3 px-2
                  flex flex-col items-center justify-center gap-1
                  transition-all duration-300
                  ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                `}
                whileTap={{ scale: 0.95 }}
                aria-label={`${getLabel(category.name)} skills`}
                aria-pressed={isActive}
              >
                {/* Active indicator - top border */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-0 right-0 h-1 rounded-b-full"
                    style={{ backgroundColor: category.color }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <span className="text-2xl">{getEmoji(category.name)}</span>

                {/* Label */}
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? 'font-semibold' : ''
                  }`}
                  style={{ color: isActive ? category.color : undefined }}
                >
                  {getLabel(category.name)}
                </span>

                {/* Active glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 -z-10 opacity-10"
                    style={{ backgroundColor: category.color }}
                    animate={{
                      opacity: [0.05, 0.15, 0.05],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </>
  );
}