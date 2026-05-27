import React from 'react';
import { useForm } from 'react-hook-form';
import {
  ClientProfileInput,
  ClientType,
  ClientEngagementType,
  ClientRetainerDuration
} from '../../lib/types';
import { cn } from '../../lib/utils';

interface ClientProfileFormProps {
  onSubmit: (data: ClientProfileInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
  initialData?: Partial<ClientProfileInput> | null;
  // Default AM userId for new clients (Pattern A: solo strategist auto-assigns self).
  defaultAccountManagerId?: string;
}

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
  { value: 'production_house', label: 'Production House' },
  { value: 'indie_producer', label: 'Indie Producer' },
  { value: 'studio', label: 'Studio' },
  { value: 'direct', label: 'Direct (no PH)' }
];

const ENGAGEMENT_TYPES: { value: ClientEngagementType; label: string }[] = [
  { value: 'project', label: 'Project-based (per film)' },
  { value: 'retainer', label: 'Retainer (ongoing)' }
];

const RETAINER_DURATIONS: { value: ClientRetainerDuration; label: string }[] = [
  { value: '3m', label: '3 months' },
  { value: '6m', label: '6 months' },
  { value: '12m', label: '12 months' },
  { value: 'ongoing', label: 'Ongoing' }
];

export default function ClientProfileForm({
  onSubmit,
  isLoading,
  submitLabel = 'Save Client',
  initialData,
  defaultAccountManagerId = ''
}: ClientProfileFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ClientProfileInput>({
    defaultValues: {
      type: 'production_house',
      engagementType: 'project',
      status: 'active',
      accountManagerId: defaultAccountManagerId,
      ...initialData
    }
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        type: initialData.type || 'production_house',
        engagementType: initialData.engagementType || 'project',
        retainerDuration: initialData.retainerDuration,
        status: initialData.status || 'active',
        accountManagerId: initialData.accountManagerId || defaultAccountManagerId
      });
    }
  }, [initialData, reset, defaultAccountManagerId]);

  const engagementType = watch('engagementType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Client Name</label>
          <input
            {...register('name', { required: 'Name is required', maxLength: { value: 200, message: 'Max 200 characters' } })}
            placeholder="e.g., Falcon Pictures"
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson focus:ring-1 focus:ring-crimson outline-none transition-all placeholder:text-ink-tertiary/50"
          />
          {errors.name && <span className="text-[10px] text-crimson mt-1 ml-1">{errors.name.message}</span>}
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Type</label>
          <select
            {...register('type', { required: true })}
            className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
          >
            {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Engagement</label>
            <select
              {...register('engagementType', { required: true })}
              className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
            >
              {ENGAGEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {engagementType === 'retainer' && (
            <div>
              <label className="block text-[11px] font-mono font-bold text-ink-tertiary uppercase mb-1.5 ml-1">Duration</label>
              <select
                {...register('retainerDuration')}
                className="w-full bg-black-3 border border-border-default rounded-card-sm px-4 py-2.5 text-[14px] focus:border-crimson outline-none hover:border-border-strong transition-colors"
              >
                {RETAINER_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <p className="text-[10px] text-ink-tertiary leading-relaxed italic">
          Account Manager + team assignment auto-set to current user. Multi-strategist support will be added when Kinema team scales beyond solo ops.
        </p>
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
            Saving...
          </>
        ) : submitLabel}
      </button>
    </form>
  );
}
