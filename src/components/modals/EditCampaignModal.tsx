import React from 'react';
import { X } from 'lucide-react';
import FilmProfileForm from '../forms/FilmProfileForm';
import { FilmProfileInput } from '../../lib/types';
import { motion, AnimatePresence } from 'motion/react';

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FilmProfileInput) => void;
  isLoading: boolean;
  initialData: any;
}

export default function EditCampaignModal({ isOpen, onClose, onSubmit, isLoading, initialData }: EditCampaignModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-black-4 border border-border-subtle w-full max-w-xl rounded-card-lg shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-black-3/50">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Edit Campaign</h3>
              <p className="text-sm text-ink-tertiary">Update campaign details and release dates.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-ink-tertiary hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-8 max-h-[80vh] overflow-y-auto">
            <FilmProfileForm 
              onSubmit={onSubmit} 
              isLoading={isLoading} 
              initialData={initialData}
              submitLabel="Update Campaign" 
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
