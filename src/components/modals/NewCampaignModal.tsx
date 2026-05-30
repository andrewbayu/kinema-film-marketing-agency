import React, { useEffect, useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FilmProfileForm from '../forms/FilmProfileForm';
import { FilmProfileInput, Client } from '../../lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../hooks/useAuth';
import { useFilmContext } from '../../hooks/useFilmContext';

export type NewCampaignSubmitInput = FilmProfileInput & { clientId: string };

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewCampaignSubmitInput) => void;
  isLoading: boolean;
}

export default function NewCampaignModal({ isOpen, onClose, onSubmit, isLoading }: NewCampaignModalProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { activeClient } = useFilmContext();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoadingClients(true);
    dbService.getClients(user.uid, isAdmin)
      .then(list => {
        setClients(list);
        // Pre-select: activeClient → only client → first → none
        if (activeClient && list.some(c => c.id === activeClient.id)) {
          setSelectedClientId(activeClient.id);
        } else if (list.length === 1) {
          setSelectedClientId(list[0].id);
        } else if (list.length === 0) {
          setSelectedClientId('');
        }
      })
      .finally(() => setLoadingClients(false));
  }, [isOpen, user, activeClient]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: FilmProfileInput) => {
    if (!selectedClientId) return;
    onSubmit({ ...data, clientId: selectedClientId });
  };

  const hasNoClients = !loadingClients && clients.length === 0;

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
          className="relative bg-black-4 border border-border-subtle w-full max-w-xl rounded-card-lg shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-black-3/50">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">New Campaign</h3>
              <p className="text-sm text-ink-tertiary">Register a new film to start simulation.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-ink-tertiary hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 max-h-[80vh] overflow-y-auto">
            {hasNoClients ? (
              <div className="bg-amber-400/5 border border-amber-400/20 rounded-card-lg p-6 text-center space-y-3">
                <Building2 className="w-10 h-10 text-amber-400 mx-auto" />
                <div className="text-[14px] font-bold text-ink-primary">Belum ada Client</div>
                <p className="text-[12px] text-ink-tertiary leading-relaxed max-w-sm mx-auto">
                  Setiap film harus di-link ke Client (production house / studio / producer). Buat Client pertama dulu.
                </p>
                <button
                  onClick={() => { onClose(); navigate('/clients'); }}
                  className="bg-amber-400 hover:bg-amber-300 text-black px-5 py-2 rounded-button font-bold text-[12px] inline-flex items-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Go to Clients
                </button>
              </div>
            ) : (
              <>
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
                    {!loadingClients && clients.length > 1 && <option value="">Select client...</option>}
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {!selectedClientId && !loadingClients && clients.length > 1 && (
                    <span className="text-[10px] text-ink-tertiary mt-1 ml-1">Film harus di-link ke salah satu Client.</span>
                  )}
                </div>

                <FilmProfileForm
                  onSubmit={handleFormSubmit}
                  isLoading={isLoading || !selectedClientId}
                  submitLabel={selectedClientId ? 'Save & Start Analysis' : 'Select Client First'}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
