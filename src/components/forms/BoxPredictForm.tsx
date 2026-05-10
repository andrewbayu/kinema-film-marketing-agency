import React from 'react';
import { useForm } from 'react-hook-form';
import { BoxPredictInput, GenreOption, BudgetTier, ReleaseWindow, IPType } from '../../lib/types';
import { cn } from '../../lib/utils';

interface BoxPredictFormProps {
  onSubmit: (data: BoxPredictInput) => void;
  isLoading?: boolean;
}

const GENRES: GenreOption[] = [
  'Horror Supernatural', 'Drama Romantis', 'Komedi', 'Keluarga / Animasi', 'Thriller / Crime', 'Biopic', 'Action'
];

const BUDGET_TIERS: { value: BudgetTier; label: string }[] = [
  { value: 'indie', label: 'Indie (< Rp 5M)' },
  { value: 'mid', label: 'Mid (Rp 5–30M)' },
  { value: 'major', label: 'Major (Rp 30M+)' }
];

const RELEASE_WINDOWS: { value: ReleaseWindow; label: string }[] = [
  { value: 'lebaran', label: 'Lebaran (2.2x)' },
  { value: 'nataru', label: 'Nataru (1.6x)' },
  { value: 'long-weekend', label: 'Long Weekend (1.3x)' },
  { value: 'regular', label: 'Regular (1.0x)' },
  { value: 'ramadan', label: 'Ramadan (0.5x)' }
];

const IP_TYPES: { value: IPType; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'adaptasi-kecil', label: 'Adaptasi Kecil' },
  { value: 'adaptasi-populer', label: 'Adaptasi Populer' },
  { value: 'major-ip', label: 'Major IP' },
  { value: 'sekuel', label: 'Sekuel' }
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
          <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest border-b border-border-subtle pb-2">PROFIL PRODUKSI</div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Judul Film</label>
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
          <div className="text-[10px] font-mono font-bold text-ink-tertiary uppercase tracking-widest border-b border-border-subtle pb-2">STRATEGI RILIS & SINYAL</div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Target Tanggal Rilis</label>
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
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Estimasi Layanan (Screens)</label>
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
                <input type="number" {...register('trailerViews')} placeholder="Opsional" className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
             <div>
                <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Trailer Velocity (D+7/D+1)</label>
                <input type="number" step="0.1" {...register('trailerVelocity')} placeholder="Opsional" className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
             </div>
          </div>

          <div>
             <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Kompetitor Utama</label>
             <input {...register('competitors')} placeholder="Pisahkan dengan koma" className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2 text-[14px]" />
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-col items-center gap-4 border-t border-border-subtle pt-8">
        <p className="text-[12px] text-ink-tertiary text-center max-w-lg">
           AI akan memproses profil film, sinyal marketing, dan konteks audiens dari AudienceDNA™ untuk memprediksi performa box office.
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
              Menjalankan Simulasi...
            </>
          ) : "Jalankan Simulasi →"}
        </button>
      </div>
    </form>
  );
}
