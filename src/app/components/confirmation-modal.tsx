import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { ModalBackdrop } from './ui/modal-backdrop';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmationModalProps) {
  return (
    <ModalBackdrop isOpen={isOpen} onClose={onCancel}>
      <motion.div
        className="modal-panel border-2 border-yellow-500/50 max-w-md w-full overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 p-6 border-b border-yellow-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 py-3 border border-slate-700 hover:bg-slate-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-semibold transition-all shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}
