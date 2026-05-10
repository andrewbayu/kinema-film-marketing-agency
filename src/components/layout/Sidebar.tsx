import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Film, 
  Users, 
  TrendingUp, 
  Activity, 
  Wand2, 
  Network, 
  MessageCircle,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFilmContext } from '../../hooks/useFilmContext';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  disabled?: boolean;
  badge?: string;
}

function NavItem({ to, icon: Icon, label, disabled, badge }: NavItemProps) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40 cursor-not-allowed text-ink-secondary group">
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-[14px] font-medium flex-1">{label}</span>
        {badge && (
          <span className="text-[9px] font-mono uppercase bg-black-2 px-1.5 py-0.5 rounded border border-border-subtle">
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
        isActive 
          ? "bg-crimson-surface text-ink-primary border border-crimson/20" 
          : "text-ink-secondary hover:bg-white/5 hover:text-ink-primary"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-crimson" : "group-hover:text-ink-primary")} />
          <span className="text-[14px] font-medium shrink-0">{label}</span>
          {badge && (isActive || true) && (
             <span className="ml-auto text-[9px] font-mono uppercase bg-black-2 px-1.5 py-0.5 rounded border border-border-subtle group-hover:border-border-default">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { activeFilm } = useFilmContext();

  return (
    <aside className="w-[220px] fixed inset-y-0 left-0 bg-black-3 border-r border-border-subtle flex flex-col z-40">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <img 
          src="https://storage.googleapis.com/bluestark_explorer/Kala.png" 
          alt="Kala Logo" 
          className="h-5 w-auto" 
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">WORKSPACE</div>
          <div className="space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/campaigns" icon={Film} label="Campaigns" />
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">INTELLIGENCE</div>
          <div className="space-y-1">
            <NavItem to="/audience-dna" icon={Users} label="AudienceDNA™" />
            <NavItem to="/box-predict" icon={TrendingUp} label="BoxPredict™" />
            <NavItem to="/live-ticker" icon={Activity} label="Live Ticker" />
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">PRODUCTION</div>
          <div className="space-y-1">
             <NavItem to="/cineforge" icon={Wand2} label="CineForge™" disabled badge="soon" />
             <NavItem to="/stargraph" icon={Network} label="StarGraph™" disabled badge="soon" />
             <NavItem to="/fanconvo" icon={MessageCircle} label="FanConvo™" disabled badge="soon" />
          </div>
        </div>
      </div>

      {/* Active Film Indicator */}
      {activeFilm && (
        <div className="p-4 border-t border-border-subtle bg-black-2/50">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-kala animate-pulse-dot" />
             <span className="text-[9px] font-mono font-bold text-green-kala uppercase">ACTIVE FILM</span>
          </div>
          <div className="font-bold text-[14px] text-ink-primary mb-0.5 truncate">{activeFilm.title}</div>
          <div className="text-[10px] text-ink-tertiary font-medium">
            {activeFilm.genre} · Week 4 · T-28 days
          </div>
          <button className="mt-4 flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors text-[11px] font-medium group">
            <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
            Settings
          </button>
        </div>
      )}
    </aside>
  );
}
