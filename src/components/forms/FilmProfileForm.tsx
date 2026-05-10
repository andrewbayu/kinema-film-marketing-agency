import React from 'react';
import { useForm } from 'react-hook-form';
import { FilmProfileInput, GenreOption, BudgetTier, ReleaseWindow, IPType } from '../../lib/types';
import { cn } from '../../lib/utils';

interface FilmProfileFormProps {
  onSubmit: (data: FilmProfileInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
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

export default function FilmProfileForm({ onSubmit, isLoading, submitLabel = "Submit" }: FilmProfileFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FilmProfileInput>({
    defaultValues: {
      budgetTier: 'mid',
      releaseWindow: 'regular',
      ipType: 'original'
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Judul Film</label>
          <input 
            {...register('title', { required: 'Judul wajib diisi' })}
            placeholder="Contoh: Sayap Patah"
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson focus:ring-1 focus:ring-crimson outline-none transition-all placeholder:text-ink-tertiary/50"
          />
          {errors.title && <span className="text-[10px] text-crimson mt-1 ml-1">{errors.title.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Genre</label>
            <select 
              {...register('genre', { required: true })}
              className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
            >
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">IP Type</label>
            <select 
              {...register('ipType', { required: true })}
              className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
            >
              {IP_TYPES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Budget Tier</label>
            <select 
              {...register('budgetTier', { required: true })}
              className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
            >
              {BUDGET_TIERS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Release Window</label>
            <select 
              {...register('releaseWindow', { required: true })}
              className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
            >
              {RELEASE_WINDOWS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Logline</label>
          <textarea 
            {...register('logline', { required: true })}
            rows={3}
            placeholder="Ringkasan cerita film dalam satu kalimat..."
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors resize-none placeholder:text-ink-tertiary/50"
          />
        </div>

        <div>
           <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Lead Cast</label>
           <input 
            {...register('leadCast', { required: true })}
            placeholder="Contoh: Reza Rahadian, Putri Marino"
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors placeholder:text-ink-tertiary/50"
          />
        </div>

        <div>
           <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Sutradara (Opsional)</label>
           <input 
            {...register('director')}
            placeholder="Nama Sutradara"
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors placeholder:text-ink-tertiary/50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full py-4 rounded-button font-bold text-[15px] transition-all flex items-center justify-center gap-2 uppercase tracking-wide",
          isLoading 
            ? "bg-black-6 text-ink-tertiary cursor-not-allowed" 
            : "bg-crimson text-white hover:bg-crimson-rich active:scale-[0.98]"
        )}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Menganalisis...
          </>
        ) : submitLabel}
      </button>
    </form>
  );
}
