import { useEffect, useRef } from 'react';
import {
  type AnalyticsEventType,
  ensureVisitorIdentity,
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
  const seenOptionsRef = useRef<Set<string>>(new Set());

  // Initialize deterministic device identity immediately on mount
  useEffect(() => {
    void ensureVisitorIdentity();
  }, []);

  // Track route screen views
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

  // Track every loaded section & option card visible on Home and subpages
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (pathname === '/analytics') return;

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const optionKey = el.dataset.trackView?.trim();
          if (!optionKey) continue;

          const dedupeKey = `${pathname}::${optionKey}`;
          if (seenOptionsRef.current.has(dedupeKey)) {
            observer.unobserve(el);
            continue;
          }
          seenOptionsRef.current.add(dedupeKey);
          observer.unobserve(el);

          const label =
            el.dataset.trackLabel?.trim() ||
            el.getAttribute('aria-label')?.trim() ||
            optionKey;
          const section = el.dataset.trackSection?.trim() || el.closest('section[id]')?.getAttribute('id') || undefined;
          const course = el.dataset.trackCourse?.trim() || undefined;
          const explicitInterest = el.dataset.trackInterest as InterestCategory | undefined;
          const interestCategory =
            explicitInterest ??
            inferInterestCategory({
              text: label,
              course,
              sectionId: section ?? '',
              screen: pathname,
            });

          trackEvent({
            eventType: 'option_view',
            eventName: `loaded_${toSlug(optionKey) || 'option'}`,
            label,
            screen: pathname,
            section,
            optionKey,
            interestCategory,
            course,
            metadata: section ? `loaded_in:${section}` : 'loaded_in_view',
          });
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const scanTargets = () => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-track-view]');
      nodes.forEach((node) => {
        if (observed.has(node)) return;
        const optionKey = node.dataset.trackView?.trim();
        if (!optionKey) return;
        if (seenOptionsRef.current.has(`${pathname}::${optionKey}`)) return;
        observed.add(node);
        observer.observe(node);
      });
    };

    const initialTimer = window.setTimeout(scanTargets, 120);
    const mutationObserver = new MutationObserver(() => {
      scanTargets();
    });
    const mainEl = document.querySelector('main') || document.body;
    mutationObserver.observe(mainEl, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(initialTimer);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  // Track every click and dropdown option selection
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
        target.dataset.trackSection ||
        sectionEl?.getAttribute('id') ||
        (sectionEl?.tagName === 'HEADER'
          ? 'header'
          : sectionEl?.tagName === 'FOOTER'
            ? 'footer'
            : sectionEl?.getAttribute('aria-label') || '');

      const optionKey =
        target.dataset.trackName ||
        target.closest<HTMLElement>('[data-track-view]')?.dataset.trackView ||
        undefined;

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
        section: sectionId || undefined,
        optionKey,
        interestCategory,
        course,
        metadata,
      });
    };

    const handleDocumentChange = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!(target instanceof HTMLSelectElement)) return;
      if (target.closest('[data-analytics-dashboard="true"]') || target.dataset.noTrack === 'true') {
        return;
      }

      const selectedText =
        target.options[target.selectedIndex]?.textContent?.trim() || target.value || '';
      if (!selectedText) return;

      const fieldId = target.id || target.name || 'select_option';
      const interestCategory = inferInterestCategory({
        text: selectedText,
        course: fieldId.includes('course') ? selectedText : undefined,
        screen: window.location.pathname,
      });

      trackEvent({
        eventType: 'tab_select',
        eventName: `select_${toSlug(fieldId)}`,
        label: `Option Selected: ${selectedText}`,
        screen: window.location.pathname,
        section: target.closest('[role="dialog"]') ? 'booking_modal' : 'contact_form',
        optionKey: `${fieldId}:${toSlug(selectedText)}`,
        interestCategory,
        course: fieldId.includes('course') ? selectedText : undefined,
        metadata: `dropdown:${fieldId}`,
      });
    };

    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('change', handleDocumentChange, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('change', handleDocumentChange, true);
    };
  }, []);

  return null;
}
