import React from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCountUp } from '../../hooks/useCountUp';

export default function StatsStrip() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.5 });

  return (
    <section 
      ref={ref as any} 
      className="bg-black-3 border-y border-border-subtle py-24 px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 md:gap-8">
        <StatItem 
          target={278}
          suffix="+"
          label="film Indonesia tayang di bioskop setiap tahun."
          source="Badan Perfilman Indonesia, 2024"
          isVisible={isVisible}
        />
        <StatItem 
          target={3}
          prefix="< "
          suffix="%"
          label="budget produksi yang masuk ke marketing. Sementara Hollywood mengalokasikan 15–30%."
          isVisible={isVisible}
        />
        <StatItem 
          target={0}
          label="agency marketing berbasis data yang fokus di film Indonesia. Sampai sekarang."
          isVisible={isVisible}
        />
        <StatItem 
          target={2}
          prefix="#"
          label="pasar TikTok terbesar di dunia. Ini Indonesia. 126 juta pengguna aktif."
          isVisible={isVisible}
        />
      </div>
    </section>
  );
}

function StatItem({ 
  target, 
  prefix = '', 
  suffix = '', 
  label, 
  source, 
  isVisible 
}: { 
  target: number, 
  prefix?: string, 
  suffix?: string, 
  label: string, 
  source?: string,
  isVisible: boolean 
}) {
  const count = useCountUp(target, 1200, isVisible);

  return (
    <div className="space-y-4">
      <div className="text-[clamp(44px,5vw,64px)] font-semibold text-crimson leading-tight tracking-tight">
        {prefix}{count}{suffix}
      </div>
      <div className="space-y-2">
        <p className="text-[14px] text-white-secondary leading-relaxed font-medium">
          {label}
        </p>
        {source && (
          <p className="font-mono text-[10px] text-white-tertiary">
            {source}
          </p>
        )}
      </div>
    </div>
  );
}
