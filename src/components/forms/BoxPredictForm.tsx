import React from 'react';
import { useForm } from 'react-hook-form';
import { BoxPredictInput, GenreOption, BudgetTier, ReleaseWindow, IPType } from '../../lib/types';
import { cn } from '../../lib/utils';

interface BoxPredictFormProps {
  onSubmit: (data: BoxPredictInput) => void;
  isLoading?: boolean;
}

const GENRES: GenreOption[] = [
  'Supernatural Horror',
  'Romantic Drama',
  'Comedy',
  'Family / Animation',
  'Thriller / Crime',
  'Biopic',
  'Action'
];

const BUDGET_TIERS: { value: BudgetTier; label: string }[] = [
  { value: 'indie', label: 'Indie (< IDR 5B)' },
  { value: 'mid', label: 'Mid (IDR 5–30B)' },
  { value: 'major', label: 'Major (IDR 30B+)' }
];

const RELEASE_WINDOWS: { value: ReleaseWindow; label: string }[] = [
  { value: 'lebaran', label: 'Eid al-Fitr (2.2x)' },
  { value: 'nataru', label: 'Christmas & New Year (1.6x)' },
  { value: 'long-weekend', label: 'Long Weekend (1.3x)' },
  { value: 'regular', label: 'Regular (1.0x)' },
  { value: 'ramadan', label: 'Ramadan (0.5x)' }
];

const IP_TYPES: { value: IPType; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'minor-adaptation', label: 'Minor Adaptation' },
  { value: 'popular-adaptation', label: 'Popular Adaptation' },
  { value: 'major-ip', label: 'Major IP' },
  { value: 'sequel', label: 'Sequel' }
];

export default function BoxPredictForm({ onSubmit, isLoading }: BoxPredictFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<BoxPredictInput>({
    defaultValues: {
      budgetTier: 'mid',
      releaseWindow: 'regular',
      ipType: 'original',
      screenCount: 1200,
      castScore: 7,
      directorScore: 7
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 2-Column Grid for major inputs */}
      <div className="grid grid-cols-2 gap-x-12 gap-y-8">
        
        {/* Basic Info Column */}
        <div className="space-y-6">
          <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest border-b border-border-subtle pb-2">PRODUCTION PROFILE</div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Film Title</label>
                <input {...register('title', { required: true })} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Genre</label>
                <select {...register('genre')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]">
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">IP Type</label>
                <select {...register('ipType')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]">
                    {IP_TYPES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Cast Score (1-10)</label>
                <input type="number" {...register('castScore')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Director Score (1-10)</label>
                <input type="number" {...register('directorScore')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
          </div>

          <div>
             <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Logline</label>
             <textarea {...register('logline')} rows={2} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px] resize-none" />
          </div>
          
          <div>
             <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Lead Cast</label>
             <input {...register('leadCast')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
          </div>
        </div>

        {/* Release & Marketing Column */}
        <div className="space-y-6">
          <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest border-b border-border-subtle pb-2">RELEASE STRATEGY & SIGNALS</div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Target Release Date</label>
                <input type="date" {...register('releaseDate')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Release Window</label>
                <select {...register('releaseWindow')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]">
                    {RELEASE_WINDOWS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Estimated Screens</label>
                <input type="number" {...register('screenCount')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Budget Tier</label>
                <select {...register('budgetTier')} className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]">
                    {BUDGET_TIERS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Trailer Views</label>
                <input type="number" {...register('trailerViews')} placeholder="Optional" className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Trailer Velocity (D+7/D+1)</label>
                <input type="number" step="0.1" {...register('trailerVelocity')} placeholder="Optional" className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
          </div>

          <div>
             <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Main Competitors</label>
             <input {...register('competitors')} placeholder="Separate with commas" className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-col items-center gap-4 border-t border-border-subtle pt-8">
        <p className="text-[12px] text-ink-tertiary text-center max-w-lg">
           AI will process the film profile, marketing signals, and audience context from AudienceDNA™ to predict box office performance.
        </p>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-12 py-4 rounded-button font-bold text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-wide",
            isLoading 
              ? "bg-black-6 text-ink-tertiary cursor-not-allowed" 
              : "bg-crimson text-white hover:bg-crimson-rich active:scale-[0.98]"
          )}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Running Simulation...
            </>
          ) : "Run Simulation →"}
        </button>
      </div>
    </form>
  );
}
