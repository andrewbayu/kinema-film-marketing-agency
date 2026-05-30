import React, { useEffect, useRef, useState } from 'react';
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
  Library,
  LogOut,
  Settings,
  ShieldCheck,
  Globe,
  Building2,
  ChevronsUpDown,
  Check,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFilmContext } from '../../hooks/useFilmContext';
import { useAuth } from '../../hooks/useAuth';
import { filmToolPath, FilmTool } from '../../lib/routes';
import { dbService } from '../../services/dbService';
import { Client } from '../../lib/types';

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
  const { activeFilm, activeClient, setActiveClient } = useFilmContext();
  const { user, isAdmin, logout } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setClients([]); return; }
    dbService.getClients(user.uid, isAdmin).then(setClients).catch(() => setClients([]));
    // Re-fetch when activeClient changes — catches the create+activate flow on /clients.
  }, [user, isAdmin, activeClient?.id]);

  useEffect(() => {
    if (!switcherOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!switcherRef.current?.contains(e.target as Node)) setSwitcherOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [switcherOpen]);

  // Tool links resolve to /clients/:clientId/films/:filmId/<tool> when a film
  // is active, else fall back to the flat legacy routes.
  const toolHref = (tool: FilmTool): string =>
    activeFilm ? filmToolPath(activeFilm.clientId, activeFilm.id, tool) : `/${tool}`;

  return (
    <aside className="w-[220px] fixed inset-y-0 left-0 bg-black-3 border-r border-border-subtle flex flex-col z-40">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <img 
          src="https://storage.googleapis.com/bluestark_explorer/kinema-logo.png" 
          alt="Kinema Logo" 
          className="h-10 w-auto" 
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-bold text-crimson uppercase tracking-widest">ADMIN</div>
            <div className="space-y-1">
              <NavItem to="/admin" icon={ShieldCheck} label="Access Portal" />
            </div>
          </div>
        )}

        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">WORKSPACE</div>
          <div className="space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/clients" icon={Building2} label="Clients" />
            <NavItem to="/campaigns" icon={Film} label="Campaigns" />
            <NavItem to="/library" icon={Library} label="Library" />
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">INTELLIGENCE</div>
          <div className="space-y-1">
            <NavItem to={toolHref('audience-dna')} icon={Users} label="AudienceDNA™" />
            <NavItem to={toolHref('box-predict')} icon={TrendingUp} label="BoxPredict™" />
            <NavItem to={toolHref('visibility-tracker')} icon={Globe} label="Visibility Tracker™" />
            <NavItem to={toolHref('live-ticker')} icon={Activity} label="Live Ticker" />
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest">PRODUCTION</div>
          <div className="space-y-1">
             <NavItem to={toolHref('cineforge')} icon={Wand2} label="CineForge™" />
             <NavItem to="/stargraph" icon={Network} label="StarGraph™" disabled badge="soon" />
             <NavItem to="/fanconvo" icon={MessageCircle} label="FanConvo™" disabled badge="soon" />
          </div>
        </div>
      </div>

      {/* Active Client & Film & User Section */}
      <div className="border-t border-border-subtle bg-black-2/50 divide-y divide-border-subtle">
        <div className="p-4 space-y-3">
          {/* Client switcher */}
          <div ref={switcherRef} className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-3 h-3 text-ink-tertiary" />
              <span className="text-[9px] font-mono font-bold text-ink-tertiary uppercase tracking-wider">CLIENT</span>
            </div>
            <button
              onClick={() => setSwitcherOpen(o => !o)}
              disabled={clients.length === 0}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border transition-colors text-left',
                clients.length === 0
                  ? 'border-border-subtle text-ink-tertiary cursor-not-allowed'
                  : 'border-border-subtle hover:border-border-default hover:bg-white/5'
              )}
            >
              <span className={cn('text-[12px] font-bold truncate', activeClient ? 'text-ink-primary' : 'text-ink-tertiary italic')}>
                {activeClient ? activeClient.name : (clients.length === 0 ? 'No clients yet' : 'All clients')}
              </span>
              {clients.length > 0 && <ChevronsUpDown className="w-3 h-3 text-ink-tertiary shrink-0" />}
            </button>

            {switcherOpen && clients.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-black-4 border border-border-default rounded-md shadow-2xl max-h-72 overflow-y-auto z-50">
                <button
                  onClick={() => { setActiveClient(null); setSwitcherOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-ink-secondary hover:bg-white/5 transition-colors border-b border-border-subtle"
                >
                  <X className="w-3 h-3 text-ink-tertiary" />
                  <span className="italic text-ink-tertiary">Clear (All clients)</span>
                </button>
                {clients.map(c => {
                  const isActive = activeClient?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setActiveClient(c); setSwitcherOpen(false); }}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3 py-2 text-[12px] hover:bg-white/5 transition-colors',
                        isActive ? 'bg-crimson-surface text-ink-primary' : 'text-ink-secondary'
                      )}
                    >
                      <span className="truncate text-left">{c.name}</span>
                      {isActive && <Check className="w-3 h-3 text-crimson shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {activeFilm && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-kala animate-pulse-dot" />
                <span className="text-[9px] font-mono font-bold text-green-kala uppercase">FILM AKTIF</span>
              </div>
              <div className="font-bold text-[14px] text-ink-primary mb-0.5 truncate">{activeFilm.title}</div>
              <div className="text-[10px] text-ink-tertiary font-medium">
                {activeFilm.genre} · Week 4 · T-28 days
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {user && (
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full border border-border-subtle bg-white/5 flex items-center justify-center overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[10px] font-bold text-ink-tertiary">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-ink-primary truncate">
                  {user.displayName || 'User'}
                </div>
                <div className="text-[10px] text-ink-tertiary truncate">
                  {user.email}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <button className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors text-[11px] font-medium group px-2 py-1.5 rounded-md hover:bg-white/5">
              <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
              Settings
            </button>
            <button 
              onClick={() => logout()}
              className="flex items-center gap-2 text-ink-secondary hover:text-crimson transition-colors text-[11px] font-medium group px-2 py-1.5 rounded-md hover:bg-crimson/5 w-full text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
