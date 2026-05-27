import React, { useState, useEffect, useMemo } from 'react';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import { cn } from '../lib/utils';
import { Search, Plus, Loader2, Edit2, Building2, AlertCircle } from 'lucide-react';
import NewCampaignModal, { NewCampaignSubmitInput } from '../components/modals/NewCampaignModal';
import EditCampaignModal from '../components/modals/EditCampaignModal';
import { dbService } from '../services/dbService';
import { useAuth } from '../hooks/useAuth';
import { Film, FilmProfileInput, Client } from '../lib/types';
import { useFilmContext } from '../hooks/useFilmContext';
import { useNavigate } from 'react-router-dom';

type FilterType = 'All' | 'active' | 'pre-release' | 'post';

export default function Campaigns() {
  const navigate = useNavigate();
  const { setActiveFilm } = useFilmContext();
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Film | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [campaigns, setCampaigns] = useState<Film[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadData(user.uid);
      } else {
        setCampaigns([]);
        setClients([]);
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const loadData = async (uid?: string) => {
    setLoading(true);
    try {
      const [campaignList, clientList] = await Promise.all([
        dbService.getCampaigns(uid),
        dbService.getClients(uid)
      ]);
      setCampaigns(campaignList || []);
      setClients(clientList || []);
    } catch (error) {
      console.error("Failed to load campaigns", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = (uid?: string) => loadData(uid ?? user?.uid);

  const handleCreateCampaign = async (data: NewCampaignSubmitInput) => {
    setIsCreating(true);
    try {
      const id = await dbService.createCampaign(data);
      if (id) {
        setIsModalOpen(false);
        loadCampaigns();
      }
    } catch (error) {
      console.error("Failed to create campaign", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCampaign = async (data: FilmProfileInput) => {
    if (!selectedCampaign) return;
    setIsUpdating(true);
    try {
      await dbService.updateCampaign(selectedCampaign.id, data);
      setIsEditModalOpen(false);
      loadCampaigns();
    } catch (error) {
      console.error("Failed to update campaign", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredFilms = campaigns.filter(film => {
    const matchesSearch = film.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || film.status === filter;
    return matchesSearch && matchesFilter;
  });

  const clientNameById = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c.name])),
    [clients]
  );

  const groupedFilms = useMemo(() => {
    const groups = new Map<string, Film[]>();
    for (const film of filteredFilms) {
      const key = film.clientId || '__unassigned';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(film);
    }
    // Order: named clients first (alpha), then __unassigned last.
    const entries = [...groups.entries()];
    entries.sort(([a], [b]) => {
      if (a === '__unassigned') return 1;
      if (b === '__unassigned') return -1;
      const nameA = clientNameById[a] || '';
      const nameB = clientNameById[b] || '';
      return nameA.localeCompare(nameB);
    });
    return entries;
  }, [filteredFilms, clientNameById]);

  const hasUnassigned = groupedFilms.some(([key]) => key === '__unassigned');

  const handleFilmClick = (film: Film) => {
    setActiveFilm(film);
    navigate('/'); // Go to overview for this film
  };

  const handleEditClick = (e: React.MouseEvent, film: Film) => {
    e.stopPropagation();
    setSelectedCampaign(film);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-[24px] font-bold text-ink-primary tracking-tight">All Campaigns</h2>
          <p className="text-[14px] text-ink-tertiary">Manage and monitor all marketing activities per film.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-crimson hover:bg-crimson-rich text-white px-6 py-2.5 rounded-button font-bold text-[14px] flex items-center gap-2 transition-all active:scale-[0.98]"
        >
           <Plus className="w-4 h-4" />
           New Campaign
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center justify-between gap-4 bg-black-4 p-4 rounded-card-lg border border-border-subtle">
        <div className="flex items-center gap-1 bg-black-2 p-1 rounded-lg border border-border-subtle">
          {(['All', 'active', 'pre-release', 'post'] as FilterType[]).map((f) => (
             <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider transition-all",
                filter === f 
                  ? "bg-black-6 text-white shadow-sm" 
                  : "text-ink-tertiary hover:text-ink-secondary"
              )}
             >
               {f}
             </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
           <input 
            type="text"
            placeholder="Search film..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black-2 border border-border-default rounded-card-sm pl-11 pr-4 py-2.5 text-[14px] text-ink-primary focus:border-crimson outline-none transition-all"
           />
        </div>
      </div>

      {hasUnassigned && (
        <div className="flex items-start gap-3 p-4 bg-amber-400/5 border border-amber-400/20 rounded-card-lg">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-[12px] text-ink-secondary">
            Beberapa film belum di-link ke Client. Buka <a href="/clients" className="text-amber-400 font-bold hover:underline">Clients</a> untuk migrate.
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-black-4 border border-border-subtle rounded-card-lg overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-crimson animate-spin" />
              <span className="text-ink-tertiary font-mono text-xs uppercase tracking-widest">Loading Campaigns...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-black-3/50 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">
                  <th className="px-6 py-4">Film + Genre</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 min-w-[200px]">Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredFilms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-ink-tertiary font-medium">
                      {searchTerm ? `No campaigns found for "${searchTerm}"` : "No campaigns yet. Create new to start."}
                    </td>
                  </tr>
                ) : groupedFilms.map(([clientId, films]) => {
                  const isUnassigned = clientId === '__unassigned';
                  const label = isUnassigned ? 'Unassigned' : (clientNameById[clientId] || 'Unknown Client');
                  return (
                    <React.Fragment key={clientId}>
                      <tr className="bg-black-3/30 border-b border-border-subtle/50">
                        <td colSpan={4} className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className={cn('w-3.5 h-3.5', isUnassigned ? 'text-amber-400' : 'text-ink-tertiary')} />
                            <span className={cn(
                              'text-[10px] font-mono font-black uppercase tracking-widest',
                              isUnassigned ? 'text-amber-400' : 'text-ink-secondary'
                            )}>
                              {label}
                            </span>
                            <span className="text-[10px] font-mono text-ink-tertiary/60">
                              · {films.length} {films.length === 1 ? 'film' : 'films'}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {films.map(film => (
                        <tr
                          key={film.id}
                          onClick={() => handleFilmClick(film)}
                          className="border-b border-border-subtle last:border-0 hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div
                                onClick={(e) => handleEditClick(e, film)}
                                className="p-2 opacity-0 group-hover:opacity-100 bg-black-2 border border-border-subtle rounded-md text-ink-tertiary hover:text-crimson hover:border-crimson/30 transition-all"
                                title="Edit Campaign Profile"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-[14px] font-bold text-ink-primary group-hover:text-white transition-colors">{film.title}</div>
                                <div className="text-[11px] text-ink-tertiary font-medium">{film.genre}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge status={film.status || 'active'} />
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[13px] font-medium text-ink-secondary">
                              {film.createdAt?.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            {film.releaseDate && (
                              <div className="text-[10px] text-ink-tertiary mt-1">
                                Release: <span className="text-white-tertiary font-bold">{film.releaseDate}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-mono font-bold">
                                <span className={cn((film.status || 'active') === 'pre-release' ? 'text-orange-kala' : 'text-crimson')}>
                                  {film.progress || 0}%
                                </span>
                              </div>
                              <ProgressBar progress={film.progress || 0} status={film.status || 'active'} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <NewCampaignModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateCampaign}
          isLoading={isCreating}
        />

        <EditCampaignModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateCampaign}
          isLoading={isUpdating}
          initialData={selectedCampaign}
        />
    </div>
  );
}

