import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Loader2, AlertCircle, Edit2 } from 'lucide-react';
import { dbService } from '../services/dbService';
import { useAuth } from '../hooks/useAuth';
import { useFilmContext } from '../hooks/useFilmContext';
import { Client, ClientProfileInput, Film } from '../lib/types';
import NewClientModal from '../components/modals/NewClientModal';
import { cn } from '../lib/utils';

const ENGAGEMENT_LABEL: Record<Client['engagementType'], string> = {
  project: 'Project',
  retainer: 'Retainer'
};

const TYPE_LABEL: Record<Client['type'], string> = {
  production_house: 'Production House',
  indie_producer: 'Indie Producer',
  studio: 'Studio',
  direct: 'Direct'
};

const STATUS_COLOR: Record<Client['status'], string> = {
  active: 'text-green-500 bg-green-500/10',
  paused: 'text-amber-400 bg-amber-400/10',
  archived: 'text-ink-tertiary bg-white/5'
};

export default function Clients() {
  const { user, loading: authLoading } = useAuth();
  const { setActiveClient } = useFilmContext();

  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadData(user.uid);
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const [clientList, campaignList] = await Promise.all([
        dbService.getClients(uid),
        dbService.getCampaigns(uid)
      ]);
      setClients(clientList);
      setCampaigns(campaignList);
    } catch (err) {
      console.error('Failed to load clients', err);
      setError('Gagal memuat data client.');
    } finally {
      setLoading(false);
    }
  };

  const unassignedCampaigns = useMemo(
    () => campaigns.filter(c => !c.clientId),
    [campaigns]
  );

  const filmsByClient = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of campaigns) {
      if (c.clientId) map[c.clientId] = (map[c.clientId] || 0) + 1;
    }
    return map;
  }, [campaigns]);

  const handleCreate = async (data: ClientProfileInput) => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      const id = await dbService.createClient({
        ...data,
        accountManagerId: data.accountManagerId || user.uid
      });
      if (id) {
        setIsModalOpen(false);
        await loadData(user.uid);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal create client.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (data: ClientProfileInput) => {
    if (!editingClient) return;
    setIsSaving(true);
    setError(null);
    try {
      await dbService.updateClient(editingClient.id, data);
      setEditingClient(null);
      if (user) await loadData(user.uid);
    } catch (err: any) {
      setError(err?.message || 'Gagal update client.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunMigration = async () => {
    if (!user || unassignedCampaigns.length === 0) return;
    setIsMigrating(true);
    setError(null);
    try {
      const defaultClientId = await dbService.createClient({
        name: 'Default (Migrated)',
        type: 'direct',
        engagementType: 'project',
        status: 'active',
        accountManagerId: user.uid
      });
      if (!defaultClientId) throw new Error('Gagal create default client.');
      await dbService.assignCampaignsToClient(
        unassignedCampaigns.map(c => c.id),
        defaultClientId
      );
      await loadData(user.uid);
    } catch (err: any) {
      setError(err?.message || 'Migration gagal.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSetActive = (client: Client) => {
    setActiveClient(client);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-crimson" />
            <h2 className="text-[24px] font-bold text-ink-primary tracking-tight">Clients</h2>
          </div>
          <p className="text-[14px] text-ink-tertiary">Production houses, studios, and producers organizing your films.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-crimson hover:bg-crimson-rich text-white px-6 py-2.5 rounded-button font-bold text-[14px] flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Client
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-crimson/5 border border-crimson/20 rounded-card-lg">
          <AlertCircle className="w-4 h-4 text-crimson flex-shrink-0 mt-0.5" />
          <div className="text-[12px] text-crimson">{error}</div>
        </div>
      )}

      {/* Migration banner: only shown when user has pre-Phase-1 campaigns without clientId */}
      {!loading && unassignedCampaigns.length > 0 && (
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-card-lg p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="text-[14px] font-bold text-ink-primary">
              {unassignedCampaigns.length} film belum di-link ke Client
            </div>
            <p className="text-[12px] text-ink-tertiary leading-relaxed">
              Film yang dibuat sebelum hierarchy ini di-introduce gak punya Client parent. Klik untuk buat
              "Default (Migrated)" Client dan assign semua film ke sana — bisa di-reassign nanti per-film.
            </p>
            <button
              onClick={handleRunMigration}
              disabled={isMigrating}
              className={cn(
                'mt-2 px-4 py-2 rounded-button font-bold text-[12px] transition-all flex items-center gap-2',
                isMigrating
                  ? 'bg-black-3 text-ink-tertiary cursor-not-allowed'
                  : 'bg-amber-400 text-black hover:bg-amber-300'
              )}
            >
              {isMigrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {isMigrating ? 'Migrating...' : `Backfill ${unassignedCampaigns.length} film`}
            </button>
          </div>
        </div>
      )}

      <div className="bg-black-4 border border-border-subtle rounded-card-lg overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-crimson animate-spin" />
            <span className="text-ink-tertiary font-mono text-xs uppercase tracking-widest">Loading Clients...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-4">
            <Building2 className="w-12 h-12 text-ink-tertiary/50 mx-auto" />
            <div className="text-[16px] font-bold text-ink-primary">Belum ada Client</div>
            <p className="text-[12px] text-ink-tertiary max-w-md mx-auto leading-relaxed">
              Mulai dengan create Client pertama (production house, studio, atau indie producer yang lo handle). Setelah itu loe bisa link film ke client tersebut.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-crimson hover:bg-crimson-rich text-white px-6 py-2.5 rounded-button font-bold text-[13px] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Client
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-black-3/50 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Engagement</th>
                <th className="px-6 py-4">Films</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr
                  key={client.id}
                  onClick={() => handleSetActive(client)}
                  className="border-b border-border-subtle last:border-0 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingClient(client); }}
                        className="p-2 opacity-0 group-hover:opacity-100 bg-black-2 border border-border-subtle rounded-md text-ink-tertiary hover:text-crimson hover:border-crimson/30 transition-all"
                        title="Edit Client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="font-bold text-[14px] text-ink-primary group-hover:text-white transition-colors">{client.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[12px] text-ink-secondary">{TYPE_LABEL[client.type]}</td>
                  <td className="px-6 py-5 text-[12px] text-ink-secondary">
                    {ENGAGEMENT_LABEL[client.engagementType]}
                    {client.engagementType === 'retainer' && client.retainerDuration && (
                      <span className="text-ink-tertiary"> · {client.retainerDuration}</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-[12px] font-mono text-ink-secondary">
                    {filmsByClient[client.id] || 0}
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider',
                      STATUS_COLOR[client.status]
                    )}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-[10px] font-mono text-ink-tertiary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      Set Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={isSaving}
        defaultAccountManagerId={user?.uid}
        mode="create"
      />

      <NewClientModal
        isOpen={editingClient !== null}
        onClose={() => setEditingClient(null)}
        onSubmit={handleEdit}
        isLoading={isSaving}
        defaultAccountManagerId={user?.uid}
        initialData={editingClient}
        mode="edit"
      />
    </div>
  );
}
