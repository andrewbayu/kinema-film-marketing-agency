import React from 'react';
import { X } from 'lucide-react';
import ClientProfileForm from '../forms/ClientProfileForm';
import { ClientProfileInput } from '../../lib/types';
import { motion, AnimatePresence } from 'motion/react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientProfileInput) => void;
  isLoading: boolean;
  defaultAccountManagerId?: string;
  initialData?: Partial<ClientProfileInput> | null;
  mode?: 'create' | 'edit';
}

export default function NewClientModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  defaultAccountManagerId,
  initialData,
  mode = 'create'
}: NewClientModalProps) {
  if (!isOpen) return null;

  const isEdit = mode === 'edit';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-black-4 border border-border-subtle w-full max-w-lg rounded-card-lg shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-black-3/50">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{isEdit ? 'Edit Client' : 'New Client'}</h3>
              <p className="text-sm text-ink-tertiary">
                {isEdit
                  ? 'Update client profile and engagement details.'
                  : 'Register a production house, studio, or producer to organize films under.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-ink-tertiary hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 max-h-[80vh] overflow-y-auto">
            <ClientProfileForm
              onSubmit={onSubmit}
              isLoading={isLoading}
              submitLabel={isEdit ? 'Save Changes' : 'Create Client'}
              initialData={initialData}
              defaultAccountManagerId={defaultAccountManagerId}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
