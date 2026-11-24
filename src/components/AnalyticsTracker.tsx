import { useEffect, useRef } from 'react';
import {
  type AnalyticsEventType,
  getScreenInfo,
  inferInterestCategory,
  type InterestCategory,
  trackEvent,
} from '../lib/analytics';
import { usePathname } from '../lib/router';

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedPathRef.current === pathname) return;
    lastTrackedPathRef.current = pathname;

    const screenInfo = getScreenInfo(pathname);
    trackEvent({
      eventType: 'screen_view',
      eventName: screenInfo.eventName,
      label: screenInfo.label,
      screen: pathname,
      interestCategory: screenInfo.interestCategory,
    });
  }, [pathname]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const origin = e.target as HTMLElement | null;
      if (!origin) return;

      const target = origin.closest('button, a, [role="button"], [role="tab"]') as HTMLElement | null;
      if (!target) return;

      if (
        target.dataset.noTrack === 'true' ||
        target.closest('[data-no-track="true"]') ||
        target.closest('[data-analytics-dashboard="true"]')
      ) {
        return;
      }

      if (target.dataset.trackExplicit === 'true') {
        return;
      }

      const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') ?? '' : '';
      const rawLabel =
        target.dataset.trackLabel ||
        target.getAttribute('aria-label') ||
        target.innerText ||
        target.textContent ||
        href ||
        'Interactive Element';
      const label = rawLabel.replace(/\s+/g, ' ').trim().slice(0, 140) || 'Interactive Element';

      const sectionEl = target.closest('section[id], header, footer, [role="dialog"]');
      const sectionId =
        sectionEl?.getAttribute('id') ||
        (sectionEl?.tagName === 'HEADER'
          ? 'header'
          : sectionEl?.tagName === 'FOOTER'
            ? 'footer'
            : sectionEl?.getAttribute('aria-label') || '');

      const isExternalOrContact =
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:');

      const explicitType = target.dataset.trackType as AnalyticsEventType | undefined;
      const eventType: AnalyticsEventType =
        explicitType ??
        (isExternalOrContact
          ? 'outbound_click'
          : target.getAttribute('role') === 'tab'
            ? 'tab_select'
            : 'button_click');

      const eventName =
        target.dataset.trackName ||
        `${target.tagName === 'A' && !isExternalOrContact ? 'nav' : 'btn'}_${toSlug(label) || 'click'}`;

      const course = target.dataset.trackCourse;
      const explicitInterest = target.dataset.trackInterest as InterestCategory | undefined;
      const interestCategory =
        explicitInterest ??
        inferInterestCategory({
          text: label,
          course,
          href,
          sectionId,
          screen: window.location.pathname,
        });

      const metadata =
        target.dataset.trackMeta ||
        (href ? `target:${href.slice(0, 120)}` : sectionId ? `section:${sectionId}` : undefined);

      trackEvent({
        eventType,
        eventName,
        label,
        screen: window.location.pathname,
        interestCategory,
        course,
        metadata,
      });
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  return null;
}
