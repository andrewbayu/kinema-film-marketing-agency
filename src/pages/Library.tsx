import React, { useState, useEffect } from 'react';
import { useFilmContext } from '../hooks/useFilmContext';
import { dbService } from '../services/dbService';
import { Film } from '../lib/types';
import { 
  Library as LibraryIcon, 
  Search, 
  ChevronRight, 
  Users, 
  TrendingUp, 
  FileText, 
  Clock,
  ExternalLink,
  Calendar,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

import { useAuth } from '../hooks/useAuth';

export default function Library() {
  const navigate = useNavigate();
  const { setActiveFilm } = useFilmContext();
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportsMap, setReportsMap] = useState<Record<string, { dna: boolean, box: boolean, fib: boolean }>>({});

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchData(user.uid);
      } else {
        setCampaigns([]);
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchData = async (uid?: string) => {
    setLoading(true);
    try {
      const data = await dbService.getCampaigns(uid);
      setCampaigns(data || []);

      if (data && data.length > 0) {
        const flags = await dbService.getCampaignReportFlags(data.map(c => c.id));
        setReportsMap(flags);
      } else {
        setReportsMap({});
      }
    } catch (err) {
      console.error("Library fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToReport = (film: Film, route: string) => {
    setActiveFilm(film);
    if (route === 'fib') {
      navigate(`/fib/${film.id}`);
    } else {
      navigate(`/${route}`);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LibraryIcon className="w-5 h-5 text-crimson" />
            <h1 className="text-2xl font-bold text-ink-primary">Intelligence Library</h1>
          </div>
          <p className="text-ink-tertiary text-sm">Access and manage all generated intelligence reports per campaign.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
            <input 
              type="text" 
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black-3 border border-border-default rounded-md text-sm focus:border-crimson outline-none w-64"
            />
          </div>
          <button className="p-2 bg-black-3 border border-border-default rounded-md hover:border-border-strong transition-colors">
            <Filter className="w-4 h-4 text-ink-secondary" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-crimson/20 border-t-crimson rounded-full animate-spin" />
          <p className="text-ink-tertiary font-mono text-[11px] animate-pulse">SYNCHRONIZING REPOSITORY...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-black-3 border border-dashed border-border-subtle rounded-xl p-16 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <LibraryIcon className="w-8 h-8 text-ink-tertiary" />
          </div>
          <h3 className="text-lg font-bold text-ink-primary mb-2">No campaigns found</h3>
          <p className="text-ink-tertiary max-w-sm mx-auto mb-6">Start by creating a new film campaign to generate intelligence reports.</p>
          <button 
            onClick={() => navigate('/campaigns')}
            className="bg-crimson text-white px-6 py-2.5 rounded-full font-bold hover:bg-crimson-rich transition-colors"
          >
            Go to Campaigns
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map((c, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={c.id}
              className="group bg-black-3 border border-border-subtle rounded-xl overflow-hidden hover:border-crimson/30 transition-all"
            >
              <div className="p-5 flex flex-col md:flex-row md:items-center gap-6">
                {/* Film Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-ink-primary truncate">{c.title}</h3>
                    <span className="shrink-0 bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-ink-tertiary uppercase border border-border-subtle">
                      {c.genre}
                    </span>
                  </div>
                    <div className="flex items-center gap-4 text-[12px] text-ink-tertiary">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {c.createdAt ? format(c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt), 'MMM dd, yyyy') : 'No date'}
                      </div>
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <Clock className="w-3.5 h-3.5" />
                        Last activity: {c.createdAt ? 'Recently' : 'Unknown'}
                      </div>
                    </div>
                </div>

                {/* Reports Summary */}
                <div className="flex flex-wrap items-center gap-3">
                  <ReportPill 
                    icon={Users} 
                    label="AudienceDNA™" 
                    active={reportsMap[c.id]?.dna} 
                    onClick={() => handleNavigateToReport(c, 'audience-dna')}
                  />
                  <ReportPill 
                    icon={TrendingUp} 
                    label="BoxPredict™" 
                    active={reportsMap[c.id]?.box} 
                    onClick={() => handleNavigateToReport(c, 'box-predict')}
                  />
                  <ReportPill 
                    icon={FileText} 
                    label="FIB Report" 
                    active={reportsMap[c.id]?.fib} 
                    onClick={() => handleNavigateToReport(c, 'fib')}
                  />
                </div>

                {/* Action */}
                <div className="md:border-l border-border-subtle md:pl-6">
                   <button 
                    onClick={() => {
                      setActiveFilm(c);
                      navigate('/');
                    }}
                    className="p-3 rounded-full hover:bg-crimson/10 text-ink-secondary hover:text-crimson transition-all"
                   >
                     <ChevronRight className="w-6 h-6" />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportPillProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function ReportPill({ icon: Icon, label, active, onClick }: ReportPillProps) {
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all group",
        active 
          ? "bg-white/5 border-border-default text-ink-primary hover:border-crimson hover:bg-crimson/5 shadow-sm" 
          : "bg-transparent border-transparent text-ink-tertiary opacity-30 cursor-not-allowed"
      )}
    >
      <Icon className={cn("w-4 h-4 transition-colors", active ? "text-crimson" : "text-ink-tertiary")} />
      <span>{label}</span>
      {active && (
        <ExternalLink className="w-3 h-3 text-ink-tertiary opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      )}
    </button>
  );
}
