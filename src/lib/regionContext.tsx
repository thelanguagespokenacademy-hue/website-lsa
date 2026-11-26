import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  detectNetworkCountry,
  detectTimezoneFallback,
  getRegionPricing,
  type DetectedCountryInfo,
  type PricingRegionId,
  type RegionPricing,
} from '../data/siteData';
import { trackEvent } from './analytics';

interface RegionContextValue {
  regionId: PricingRegionId;
  region: RegionPricing;
  countryCode: string;
  countryName: string;
  detectionSource: 'network_ip' | 'timezone_fallback';
  isDetecting: boolean;
}

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [detected, setDetected] = useState<DetectedCountryInfo>(() =>
    typeof window !== 'undefined'
      ? detectTimezoneFallback()
      : { regionId: 'pakistan', countryCode: 'PK', countryName: 'Pakistan' }
  );
  const [detectionSource, setDetectionSource] = useState<'network_ip' | 'timezone_fallback'>(
    'timezone_fallback'
  );
  const [isDetecting, setIsDetecting] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    try {
      window.localStorage.removeItem('lsh_pricing_region_v1');
    } catch {
      // ignore storage cleanup
    }

    detectNetworkCountry()
      .then((ipInfo) => {
        if (!active) return;
        if (ipInfo) {
          setDetected(ipInfo);
          setDetectionSource('network_ip');
          const pricing = getRegionPricing(ipInfo.regionId);
          trackEvent({
            eventType: 'option_view',
            eventName: 'geo_country_detected',
            label: `Network Country: ${ipInfo.countryName} (${pricing.monthlyPrice})`,
            interestCategory: 'general_info',
            metadata: `${ipInfo.countryCode}:${pricing.currencyCode}`,
          });
        }
      })
      .finally(() => {
        if (active) setIsDetecting(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<RegionContextValue>(() => {
    const region = getRegionPricing(detected.regionId);
    return {
      regionId: detected.regionId,
      region,
      countryCode: detected.countryCode,
      countryName: detected.countryName,
      detectionSource,
      isDetecting,
    };
  }, [detected, detectionSource, isDetecting]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegionPricing() {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    throw new Error('useRegionPricing must be used inside RegionProvider');
  }
  return ctx;
}
