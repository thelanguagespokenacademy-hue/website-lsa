import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Download,
  ExternalLink,
  Eye,
  MousePointerClick,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  type AnalyticsEventType,
  clearLocalSessionEvents,
  EVENT_TYPE_LABELS,
  getLocalSessionEvents,
  INTEREST_LABELS,
  type InterestCategory,
  type LocalAnalyticsEvent,
} from '../lib/analytics';
import {
  FIREBASE_APP_ID,
  FIREBASE_PROJECT_ID,
  getFirebaseAnalyticsStatus,
  initFirebaseAnalytics,
} from '../lib/firebase';

const INTEREST_FILTERS: Array<{ id: 'all' | InterestCategory; label: string }> = [
  { id: 'all', label: 'All Interests' },
  { id: 'kids_program', label: 'Kids Program' },
  { id: 'womens_program', label: 'Women’s Spoken' },
  { id: 'teacher_track', label: 'Teachers' },
  { id: 'trial_booking', label: 'Trial Booking' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'stories', label: 'Stories' },
  { id: 'contact', label: 'Call & Email' },
];

function formatTime(ms: number): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

function escapeCsv(value: string | undefined): string {
  const safe = (value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
}

export function AnalyticsDashboard() {
  const [events, setEvents] = useState<LocalAnalyticsEvent[]>(() => getLocalSessionEvents());
  const [status, setStatus] = useState(() => getFirebaseAnalyticsStatus());

  const [interestFilter, setInterestFilter] = useState<'all' | InterestCategory>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AnalyticsEventType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void initFirebaseAnalytics().then(() => {
      setStatus(getFirebaseAnalyticsStatus());
    });
  }, []);

  useEffect(() => {
    const refresh = () => setEvents(getLocalSessionEvents());
    window.addEventListener('lsh:analytics-updated', refresh);
    return () => window.removeEventListener('lsh:analytics-updated', refresh);
  }, []);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((item) => {
      if (interestFilter !== 'all' && item.interestCategory !== interestFilter) return false;
      if (typeFilter !== 'all' && item.eventType !== typeFilter) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.firebaseEventName.toLowerCase().includes(q) ||
        item.eventName.toLowerCase().includes(q) ||
        item.screen.toLowerCase().includes(q) ||
        (item.course ?? '').toLowerCase().includes(q) ||
        (item.metadata ?? '').toLowerCase().includes(q)
      );
    });
  }, [events, interestFilter, typeFilter, searchQuery]);

  const metrics = useMemo(() => {
    const total = filteredEvents.length;
    const screenViews = filteredEvents.filter((e) => e.eventType === 'screen_view').length;
    const clicks = filteredEvents.filter(
      (e) =>
        e.eventType === 'button_click' ||
        e.eventType === 'tab_select' ||
        e.eventType === 'outbound_click'
    ).length;
    const bookingIntent = filteredEvents.filter(
      (e) =>
        e.interestCategory === 'trial_booking' ||
        e.eventType === 'form_submit' ||
        e.firebaseEventName === 'generate_lead'
    ).length;

    const interestCounts = new Map<InterestCategory, number>();
    const screenCounts = new Map<string, number>();
    const buttonCounts = new Map<
      string,
      {
        label: string;
        firebaseEventName: string;
        screen: string;
        interest: InterestCategory;
        count: number;
      }
    >();
    const courseCounts = new Map<string, number>();

    for (const ev of filteredEvents) {
      interestCounts.set(ev.interestCategory, (interestCounts.get(ev.interestCategory) ?? 0) + 1);

      if (ev.eventType === 'screen_view') {
        screenCounts.set(ev.screen, (screenCounts.get(ev.screen) ?? 0) + 1);
      } else {
        const key = `${ev.firebaseEventName}::${ev.screen}`;
        const prev = buttonCounts.get(key);
        if (prev) {
          prev.count += 1;
        } else {
          buttonCounts.set(key, {
            label: ev.label,
            firebaseEventName: ev.firebaseEventName,
            screen: ev.screen,
            interest: ev.interestCategory,
            count: 1,
          });
        }
      }

      if (ev.course) {
        courseCounts.set(ev.course, (courseCounts.get(ev.course) ?? 0) + 1);
      }
    }

    const interestBreakdown = Array.from(interestCounts.entries())
      .map(([category, count]) => ({
        category,
        label: INTEREST_LABELS[category] ?? category,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topScreens = Array.from(screenCounts.entries())
      .map(([screen, count]) => ({
        screen,
        count,
        pct: screenViews > 0 ? Math.round((count / screenViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topButtons = Array.from(buttonCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCourses = Array.from(courseCounts.entries())
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      total,
      screenViews,
      clicks,
      bookingIntent,
      interestBreakdown,
      topScreens,
      topButtons,
      topCourses,
    };
  }, [filteredEvents]);

  const handleDownloadCsv = () => {
    const header = [
      'Timestamp',
      'Firebase Event Name',
      'Event Type',
      'Screen',
      'Label',
      'Interest Category',
      'Course',
      'Context',
    ].join(',');
    const lines = filteredEvents.map((ev) =>
      [
        escapeCsv(new Date(ev.createdAtMs).toISOString()),
        escapeCsv(ev.firebaseEventName),
        escapeCsv(ev.eventType),
        escapeCsv(ev.screen),
        escapeCsv(ev.label),
        escapeCsv(ev.interestCategory),
        escapeCsv(ev.course),
        escapeCsv(ev.metadata),
      ].join(',')
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lsh-firebase-event-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const firebaseConsoleUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/analytics`;
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/settings/general`;

  return (
    <section className="section pt-10" data-analytics-dashboard="true">
      <div className="shell space-y-8">
        {/* Firebase Analytics Mode Banner */}
        <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">
                Firebase Analytics (Free Event Logs · No Database Quota)
              </span>
              <span aria-hidden="true">·</span>
              <span>
                SDK:{' '}
                {status.state === 'ready'
                  ? `Connected (${status.measurementId})`
                  : status.state === 'missing_measurement_id'
                    ? 'Needs Google Analytics Link (G-ID)'
                    : status.state === 'unsupported'
                      ? 'Browser Storage Fallback'
                      : 'Initializing'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{FIREBASE_PROJECT_ID}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Firebase Event Logs &amp; User Interest
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Every screen view and button click dispatches a free{' '}
              <code className="text-primary">logEvent()</code> call to Firebase Analytics with zero
              Firestore database reads or writes. View aggregated visitor reports in Firebase
              Console, and inspect your live session events below.
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              App ID: {FIREBASE_APP_ID}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={firebaseConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm h-10 px-5 hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Open Firebase Analytics
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>

            {events.length > 0 && (
              <button
                type="button"
                onClick={clearLocalSessionEvents}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 text-muted-foreground font-semibold text-xs sm:text-sm h-10 px-4 cursor-pointer hover:text-foreground hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                Clear Session Log
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={filteredEvents.length === 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 text-foreground font-semibold text-xs sm:text-sm h-10 px-4 cursor-pointer hover:border-primary/50 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              Download CSV
            </button>
          </div>
        </div>

        {(status.state === 'missing_measurement_id' || status.invalidMeasurementId) && (
          <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 sm:p-5 text-xs sm:text-sm text-amber-100 space-y-2">
            {status.invalidMeasurementId && (
              <p>
                <strong className="text-amber-300">Invalid Measurement ID ignored:</strong>{' '}
                <code className="font-mono text-amber-200">{status.invalidMeasurementId}</code> is
                a Firebase Project ID, not a Google Analytics Measurement ID (which starts with{' '}
                <code className="font-mono">G-</code>).
              </p>
            )}
            {status.state === 'missing_measurement_id' && (
              <p>
                Firebase returned <code className="font-mono">measurementId: undefined</code> for
                Web App <code className="font-mono">{FIREBASE_APP_ID}</code>. Open{' '}
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline font-semibold"
                >
                  Firebase Project Settings
                </a>{' '}
                → <strong>Integrations → Google Analytics</strong> (or link your Web App to a GA4
                Data Stream) so Firebase provides a <code className="font-mono">G-XXXXXXXXXX</code>{' '}
                Measurement ID, or set <code className="font-mono">VITE_FIREBASE_MEASUREMENT_ID</code>{' '}
                to that <code className="font-mono">G-...</code> ID.
              </p>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[#110f0f] border border-white/10">
            {INTEREST_FILTERS.map((tab) => {
              const active = interestFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInterestFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by event type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | AnalyticsEventType)}
              className="h-10 rounded-xl border border-white/15 bg-[#110f0f] px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Event Types</option>
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search event, button, screen..."
                className="w-full h-10 rounded-xl border border-white/15 bg-[#110f0f] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Logged Session Events</span>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground tabular-nums">
              {metrics.total}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Dispatched via Firebase logEvent()
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Screen Views</span>
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground tabular-nums">
              {metrics.screenViews}
            </div>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {metrics.topScreens[0] ? `Top: ${metrics.topScreens[0].screen}` : 'No screen views yet'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Button &amp; Link Clicks</span>
              <MousePointerClick className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground tabular-nums">
              {metrics.clicks}
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {metrics.topButtons[0] ? `Top: ${metrics.topButtons[0].label}` : 'No button clicks yet'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Booking &amp; Lead Events</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold text-primary tabular-nums">
              {metrics.bookingIntent}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              generate_lead, WhatsApp &amp; demo CTAs
            </p>
          </div>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-10 text-center space-y-2">
            <Activity className="h-7 w-7 text-primary mx-auto" />
            <h3 className="text-lg font-bold text-foreground">No matching session events yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Navigate across pages and click any button, program card, or modal CTA to watch the
              Firebase Analytics event logs appear here in real time.
            </p>
          </div>
        )}

        {/* Breakdown Grids */}
        {filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6">
              <h3 className="text-base font-bold text-foreground">Session Interest Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-5">
                Mapped to Firebase Analytics <code className="text-primary">latest_interest</code>{' '}
                user property
              </p>

              <div className="space-y-4">
                {metrics.interestBreakdown.map((row) => (
                  <div key={row.category} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-foreground truncate">{row.label}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {row.count} ({row.pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.max(4, row.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6">
              <h3 className="text-base font-bold text-foreground">Course &amp; Age-Group Demand</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-5">
                Sent via <code className="text-primary">course_name</code> event parameter
              </p>

              {metrics.topCourses.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  Click any course Enroll button or Kids Age Tier to inspect course parameters.
                </p>
              ) : (
                <div className="divide-y divide-white/8">
                  {metrics.topCourses.map((item) => (
                    <div
                      key={item.course}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-foreground font-medium truncate">{item.course}</span>
                      <span className="font-bold text-primary tabular-nums shrink-0">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6">
              <h3 className="text-base font-bold text-foreground">
                Screens Viewed (<code className="text-primary">screen_view</code>)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                Routes logged to Firebase Analytics
              </p>

              {metrics.topScreens.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No screen views match the current filter.
                </p>
              ) : (
                <div className="divide-y divide-white/8">
                  {metrics.topScreens.map((item) => (
                    <div
                      key={item.screen}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-mono text-foreground truncate">{item.screen}</span>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        <strong className="text-foreground">{item.count}</strong> views · {item.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6">
              <h3 className="text-base font-bold text-foreground">Most Clicked Buttons &amp; CTAs</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                Firebase event names &amp; click counts in this session
              </p>

              {metrics.topButtons.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No button clicks match the current filter.
                </p>
              ) : (
                <div className="divide-y divide-white/8">
                  {metrics.topButtons.map((btn) => (
                    <div
                      key={`${btn.firebaseEventName}-${btn.screen}`}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{btn.label}</div>
                        <div className="text-[11px] text-muted-foreground truncate font-mono">
                          {btn.firebaseEventName} · {btn.screen}
                        </div>
                      </div>
                      <span className="font-bold text-primary tabular-nums shrink-0">
                        {btn.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Event Stream */}
        {filteredEvents.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#110f0f] overflow-hidden">
            <div className="p-5 sm:px-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Firebase Event Payload Stream
                </h3>
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(filteredEvents.length, 60)} most recent{' '}
                  <code className="text-primary">logEvent()</code> dispatches
                </p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                Total matching: {filteredEvents.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Time</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Firebase Event</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Screen</th>
                    <th className="py-3 px-4 font-semibold">Button / Label</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Interest</th>
                    <th className="py-3 px-4 font-semibold">Course / Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredEvents.slice(0, 60).map((ev) => (
                    <tr key={ev.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-4 text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatTime(ev.createdAtMs)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-primary whitespace-nowrap">
                        {ev.firebaseEventName}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {ev.screen}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-foreground max-w-[260px] truncate">
                        {ev.label}
                      </td>
                      <td className="py-2.5 px-4 text-foreground whitespace-nowrap">
                        {INTEREST_LABELS[ev.interestCategory] ?? ev.interestCategory}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground max-w-[260px] truncate">
                        {ev.course || ev.metadata || EVENT_TYPE_LABELS[ev.eventType]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
