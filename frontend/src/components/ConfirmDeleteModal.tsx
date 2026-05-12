import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDeleteModal = ({ title, message, onConfirm, onCancel, loading }: ConfirmDeleteModalProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
    onClick={onCancel}
  >
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-bone border-4 border-black shadow-brutal w-full max-w-sm p-8"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-2">
        <Trash2 size={18} className="text-vibrant-coral shrink-0" />
        <h2 className="font-display uppercase text-xl tracking-tighter">{title}</h2>
      </div>
      <p className="font-mono text-xs opacity-70 leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 border-2 border-black font-display uppercase text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 bg-rosy-copper text-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);
