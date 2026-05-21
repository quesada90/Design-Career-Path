import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Sparkles, Target } from 'lucide-react';
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';

interface QuestCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetType: 'role' | 'skill';
  onUpdateProficiency?: () => void; // Only for skills
}

export function QuestCelebrationModal({
  isOpen,
  onClose,
  targetName,
  targetType,
  onUpdateProficiency,
}: QuestCelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti */}
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.3}
            />
          )}

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden mx-2 border-2 border-cyan-500/50"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            {/* Header with Gradient */}
            <div className="relative px-6 py-8 bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-purple-600/20">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Trophy Icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-3xl font-bold text-center text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Quest Completed!
              </motion.h2>

              <motion.div
                className="flex items-center justify-center gap-2 text-cyan-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {targetType === 'role' ? (
                  <Target className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <p className="text-lg">
                  {targetType === 'role' ? 'Target Role' : 'Target Skill'}
                </p>
              </motion.div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <motion.div
                className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-center text-gray-300 mb-2">
                  You've completed all tasks for:
                </p>
                <h3 className="text-xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {targetName}
                </h3>
              </motion.div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {targetType === 'skill' && onUpdateProficiency && (
                  <button
                    onClick={() => {
                      onUpdateProficiency();
                      onClose();
                    }}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Update Skill Proficiency</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                >
                  {targetType === 'skill' ? 'Continue Later' : 'Close'}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
