import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import FilmProfileForm from '../forms/FilmProfileForm';
import { FilmProfileInput, Client, Film } from '../../lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../hooks/useAuth';

export type EditCampaignSubmitInput = FilmProfileInput & { clientId?: string };

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditCampaignSubmitInput) => void;
  isLoading: boolean;
  initialData: Film | null;
}

export default function EditCampaignModal({ isOpen, onClose, onSubmit, isLoading, initialData }: EditCampaignModalProps) {
  const { user, isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoadingClients(true);
    dbService.getClients(user.uid, isAdmin)
      .then(list => {
        setClients(list);
        setSelectedClientId(initialData?.clientId || '');
      })
      .finally(() => setLoadingClients(false));
  }, [isOpen, user, isAdmin, initialData?.clientId]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: FilmProfileInput) => {
    onSubmit({ ...data, clientId: selectedClientId || undefined });
  };

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
            <div className="mb-6">
              <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">
                Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={loadingClients}
                className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
              >
                {loadingClients && <option value="">Loading...</option>}
                {!loadingClients && <option value="">— Unassigned —</option>}
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {!loadingClients && initialData?.clientId && selectedClientId !== initialData.clientId && (
                <span className="text-[10px] text-amber-400 mt-1 ml-1">
                  Film akan dipindah ke Client lain saat di-save.
                </span>
              )}
            </div>

            <FilmProfileForm
              onSubmit={handleFormSubmit}
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
