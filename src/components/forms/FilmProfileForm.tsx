import React from 'react';
import { useForm } from 'react-hook-form';
import { FilmProfileInput, GenreOption, BudgetTier, IPType } from '../../lib/types';
import { cn } from '../../lib/utils';

interface FilmProfileFormProps {
  onSubmit: (data: FilmProfileInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
  initialData?: Partial<FilmProfileInput> | null;
}

const GENRES: GenreOption[] = [
  'Supernatural Horror',
  'Horror',
  'Romantic Drama',
  'Comedy',
  'Horror Comedy',
  'Adventure / Horror Comedy',
  'Family / Animation',
  'Thriller / Crime',
  'Action',
  'Drama',
  'Biopic',
  'Religious Drama',
  'History',
  'Musical',
  'Documentary'
];

const BUDGET_TIERS: { value: BudgetTier; label: string }[] = [
  { value: 'indie', label: 'Indie (< IDR 5B)' },
  { value: 'mid', label: 'Mid (IDR 5–30B)' },
  { value: 'major', label: 'Major (IDR 30B+)' }
];

const IP_TYPES: { value: IPType; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'minor-adaptation', label: 'Minor Adaptation' },
  { value: 'popular-adaptation', label: 'Popular Adaptation' },
  { value: 'major-ip', label: 'Major IP' },
  { value: 'sequel', label: 'Sequel' }
];

export default function FilmProfileForm({ onSubmit, isLoading, submitLabel = "Submit", initialData }: FilmProfileFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FilmProfileInput>({
    defaultValues: {
      budgetTier: 'mid',
      ipType: 'original',
      ...initialData
    }
  });

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        genre: initialData.genre || 'Supernatural Horror',
        budgetTier: initialData.budgetTier || 'mid',
        logline: initialData.logline || '',
        leadCast: initialData.leadCast || '',
        ipType: initialData.ipType || 'original',
        director: initialData.director || ''
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Film Title</label>
          <input 
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g., Broken Wings"
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

        <div className="grid grid-cols-1 gap-4">
           <div>
            <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Budget Tier</label>
            <select 
              {...register('budgetTier', { required: true })}
              className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
            >
              {BUDGET_TIERS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Logline</label>
          <textarea 
            {...register('logline', { required: true })}
            rows={3}
            placeholder="Film story summary in one sentence..."
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors resize-none placeholder:text-ink-tertiary/50"
          />
        </div>

        <div>
           <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Lead Cast</label>
           <input 
            {...register('leadCast', { required: true })}
            placeholder="e.g., Reza Rahadian, Putri Marino"
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors placeholder:text-ink-tertiary/50"
          />
        </div>

        <div>
           <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Director (Optional)</label>
           <input 
            {...register('director')}
            placeholder="Director Name"
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
            Analyzing...
          </>
        ) : submitLabel}
      </button>
    </form>
  );
}
