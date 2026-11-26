import { Globe } from 'lucide-react';
import { useRegionPricing } from '../lib/regionContext';

interface CountryPriceBarProps {
  compact?: boolean;
  className?: string;
}

export function CountryPriceBar({ compact = false, className = '' }: CountryPriceBarProps) {
  const { region, countryName } = useRegionPricing();

  return (
    <div className={className}>
      <div
        className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 ${
          compact ? 'text-xs' : 'text-xs sm:text-sm'
        }`}
      >
        <div className="inline-flex items-center gap-2 text-muted-foreground font-medium">
          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Pricing for <span className="text-foreground font-semibold">{countryName}</span>
          </span>
        </div>

        <div className="font-bold text-primary tabular-nums">
          {region.monthlyPrice}{' '}
          <span className="text-[11px] font-medium text-zinc-300">/ month · All Courses</span>
        </div>
      </div>
    </div>
  );
}
