import React, { useEffect, useState } from 'react';
import MetricCard from '../components/ui/MetricCard';
import AlertBanner from '../components/ui/AlertBanner';
import StatusBadge from '../components/ui/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import { cn } from '../lib/utils';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import { useFilmContext } from '../hooks/useFilmContext';

export default function Overview() {
  const navigate = useNavigate();
  const { setActiveFilm } = useFilmContext();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getCampaigns();
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error loading overview data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilmClick = (film: any) => {
    const selectedFilm = {
      id: film.id,
      title: film.title,
      genre: film.genre,
      client: 'Internal',
      phase: film.phase || 'Development',
      daysToRelease: film.daysToRelease || 90,
      reach: film.reach || '0',
      occupancy: film.occupancy || null,
      status: film.status || 'active',
      progress: film.progress || 0
    };
    setActiveFilm(selectedFilm);
    navigate('/');
  };

  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const preReleaseCount = campaigns.filter(c => c.status === 'pre-release').length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard 
          label="Active Campaigns"
          value={campaigns.length.toString()}
          sub={`${activeCount} active · ${preReleaseCount} pre`}
          valueColor="default"
        />
        <MetricCard 
          label="Total Reach This Week"
          value="0"
          sub="Simulation Mode"
          valueColor="green"
        />
        <MetricCard 
          label="Avg Occupancy"
          value="--"
          sub="No Live Data"
          valueColor="orange"
        />
        <MetricCard 
          label="Open Alerts"
          value="0"
          sub="All systems clear"
          valueColor="crimson"
        />
      </div>

      {campaigns.length === 0 && !loading && (
        <div className="bg-black-4 border border-border-subtle p-12 rounded-card-lg text-center space-y-4">
           <h3 className="text-xl font-bold text-white">Welcome to Kinema</h3>
           <p className="text-ink-tertiary max-w-md mx-auto">You don't have any active campaigns. Start by creating a new campaign to analyze audiences and predict box office.</p>
           <button 
            onClick={() => navigate('/campaigns')}
            className="bg-crimson px-6 py-2 rounded-button font-bold text-white"
           >
             Create First Campaign
           </button>
        </div>
      )}

      {/* Campaign Table Section */}
      {campaigns.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-ink-primary">Your Campaigns</h2>
            <button 
              onClick={() => navigate('/campaigns')}
              className="text-[12px] font-medium text-ink-tertiary hover:text-ink-primary transition-colors flex items-center gap-1 group"
            >
              View all
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="bg-black-4 border border-border-subtle rounded-card-lg overflow-hidden">
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
                    <th className="px-6 py-4 min-w-[200px]">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.slice(0, 5).map((film) => (
                    <tr 
                      key={film.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => handleFilmClick(film)}
                    >
                      <td className="px-6 py-5">
                        <div>
                          <div className="text-[14px] font-bold text-ink-primary group-hover:text-white transition-colors">{film.title}</div>
                          <div className="text-[11px] text-ink-tertiary font-medium">{film.genre}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={film.status || 'active'} />
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
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

