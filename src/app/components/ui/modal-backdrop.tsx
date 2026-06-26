'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalBackdropProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  /** Extra classes for the inner panel wrapper */
  className?: string;
}

export function ModalBackdrop({ isOpen, onClose, children, className = '' }: ModalBackdropProps) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className={className} onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
