import { useCallback, useEffect, useMemo, useState } from 'react';
import { type User } from 'firebase/auth';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Eye,
  LogIn,
  LogOut,
  MousePointerClick,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  type AnalyticsEventType,
  clearLocalSessionEvents,
  deleteVisitorProfile,
  ensureVisitorIdentity,
  EVENT_TYPE_LABELS,
  fetchAllVisitors,
  fetchVisitorEvents,
  type FirestoreVisitorRecord,
  getExploredOptions,
  getFirestoreSyncStatus,
  getLocalSessionEvents,
  getVisitorIdentity,
  INTEREST_LABELS,
  type InterestCategory,
  type LocalAnalyticsEvent,
} from '../lib/analytics';
import {
  ADMIN_EMAIL,
  FIREBASE_PROJECT_ID,
  FIRESTORE_DATABASE_ID,
  signInWithGooglePopup,
  signOutUser,
  subscribeAuth,
} from '../lib/firebase';

const INTEREST_FILTERS: Array<{ id: 'all' | InterestCategory; label: string }> = [
  { id: 'all', label: 'All Interests' },
  { id: 'kids_program', label: 'Kids Program' },
  { id: 'womens_program', label: 'Women’s Spoken' },
  { id: 'teacher_track', label: 'Teachers' },
  { id: 'trial_booking', label: 'Trial Booking' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'stories', label: 'Stories & Videos' },
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
  const [identity, setIdentity] = useState(() => getVisitorIdentity());
  const [events, setEvents] = useState<LocalAnalyticsEvent[]>(() => getLocalSessionEvents());
  const [exploredOptions, setExploredOptions] = useState<string[]>(() => getExploredOptions());
  const [syncStatus, setSyncStatus] = useState(() => getFirestoreSyncStatus());

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [visitors, setVisitors] = useState<FirestoreVisitorRecord[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<FirestoreVisitorRecord | null>(null);
  const [remoteEvents, setRemoteEvents] = useState<LocalAnalyticsEvent[] | null>(null);
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [loadingVisitorEvents, setLoadingVisitorEvents] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [interestFilter, setInterestFilter] = useState<'all' | InterestCategory>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AnalyticsEventType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isOwner =
    Boolean(authUser?.emailVerified) &&
    authUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setAuthUser(user);
      setAdminError(null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    void ensureVisitorIdentity().then((id) => setIdentity(id));
    const refresh = () => {
      setIdentity(getVisitorIdentity());
      setEvents(getLocalSessionEvents());
      setExploredOptions(getExploredOptions());
      setSyncStatus(getFirestoreSyncStatus());
    };
    window.addEventListener('lsh:analytics-updated', refresh);
    return () => window.removeEventListener('lsh:analytics-updated', refresh);
  }, []);

  const loadVisitors = useCallback(async () => {
    setLoadingVisitors(true);
    setAdminError(null);
    try {
      const list = await fetchAllVisitors();
      setVisitors(list);
      if (list.length > 0 && !selectedVisitor) {
        setSelectedVisitor(list[0]);
      }
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to load visitors from Firestore.');
    } finally {
      setLoadingVisitors(false);
    }
  }, [selectedVisitor]);

  useEffect(() => {
    if (isOwner) {
      void loadVisitors();
    } else {
      setVisitors([]);
      setSelectedVisitor(null);
      setRemoteEvents(null);
    }
  }, [isOwner, loadVisitors]);

  useEffect(() => {
    if (!isOwner || !selectedVisitor) {
      setRemoteEvents(null);
      return;
    }
    let cancelled = false;
    setLoadingVisitorEvents(true);
    void fetchVisitorEvents(selectedVisitor.visitorId)
      .then((list) => {
        if (!cancelled) setRemoteEvents(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setAdminError(err instanceof Error ? err.message : 'Unable to load visitor events.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingVisitorEvents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, selectedVisitor]);

  const activeEvents = isOwner && selectedVisitor && remoteEvents ? remoteEvents : events;

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeEvents.filter((item) => {
      if (interestFilter !== 'all' && item.interestCategory !== interestFilter) return false;
      if (typeFilter !== 'all' && item.eventType !== typeFilter) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.firebaseEventName.toLowerCase().includes(q) ||
        item.eventName.toLowerCase().includes(q) ||
        item.screen.toLowerCase().includes(q) ||
        (item.section ?? '').toLowerCase().includes(q) ||
        (item.optionKey ?? '').toLowerCase().includes(q) ||
        (item.course ?? '').toLowerCase().includes(q) ||
        (item.metadata ?? '').toLowerCase().includes(q)
      );
    });
  }, [activeEvents, interestFilter, typeFilter, searchQuery]);

  const metrics = useMemo(() => {
    const total = filteredEvents.length;
    const screenViews = filteredEvents.filter((e) => e.eventType === 'screen_view').length;
    const optionsLoaded = filteredEvents.filter((e) => e.eventType === 'option_view').length;
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
        const key = `${ev.eventName}::${ev.screen}`;
        const prev = buttonCounts.get(key);
        if (prev) {
          prev.count += 1;
        } else {
          buttonCounts.set(key, {
            label: ev.label,
            firebaseEventName: ev.eventName,
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
      .slice(0, 12);

    const topCourses = Array.from(courseCounts.entries())
      .map(([course, count]) => ({ course, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      total,
      screenViews,
      optionsLoaded,
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
      'Visitor ID',
      'Session ID',
      'Visit #',
      'Event Type',
      'Event Name',
      'Screen',
      'Section',
      'Label',
      'Interest Category',
      'Course',
      'Context',
    ].join(',');
    const lines = filteredEvents.map((ev) =>
      [
        escapeCsv(ev.createdAtMs ? new Date(ev.createdAtMs).toISOString() : ''),
        escapeCsv(ev.visitorId),
        escapeCsv(ev.sessionId),
        escapeCsv(String(ev.visitNumber)),
        escapeCsv(ev.eventType),
        escapeCsv(ev.eventName),
        escapeCsv(ev.screen),
        escapeCsv(ev.section),
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
    anchor.download = `lsh-visitor-events-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSignInOwner = async () => {
    setAdminError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Google sign-in cancelled or failed.');
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    setAdminError(null);
    try {
      await deleteVisitorProfile(visitorId);
      setVisitors((prev) => prev.filter((v) => v.visitorId !== visitorId));
      if (selectedVisitor?.visitorId === visitorId) {
        setSelectedVisitor(null);
        setRemoteEvents(null);
      }
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Failed to delete visitor record.');
    }
  };

  const firestoreConsoleUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data/~2Fvisitors`;

  return (
    <section className="section pt-10" data-analytics-dashboard="true">
      <div className="shell space-y-8">
        {/* Persistent Visitor Identity & Firestore Sync Banner */}
        <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary inline-flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Persistent Visitor Identity
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-primary" />
                Firestore:{' '}
                {syncStatus.state === 'synced'
                  ? `Synced (${syncStatus.syncedCount} events)`
                  : syncStatus.state === 'syncing'
                    ? 'Syncing...'
                    : syncStatus.state === 'error'
                      ? 'Sync Issue'
                      : 'Ready'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{FIREBASE_PROJECT_ID}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Returning User Recognition &amp; Complete Option Activity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                <span className="text-muted-foreground block">Unique Device ID</span>
                <code className="font-mono text-primary font-semibold break-all">
                  {identity.visitorId}
                </code>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                <span className="text-muted-foreground block">Device Signature</span>
                <span className="text-foreground font-medium block truncate" title={identity.deviceSummary}>
                  {identity.deviceSummary}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                <span className="text-muted-foreground block">Visit Count &amp; Status</span>
                <span className="font-semibold text-foreground tabular-nums">
                  Visit #{identity.visitCount} ·{' '}
                  {identity.isReturning ? 'Returning Device' : 'First Visit'}
                </span>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                <span className="text-muted-foreground block">Device Token &amp; Session</span>
                <code className="font-mono text-muted-foreground break-all">
                  {identity.visitorToken.slice(0, 14)}…
                </code>
              </div>
            </div>

            {syncStatus.lastError && (
              <p className="text-xs text-amber-300 font-mono break-all pt-1">
                {syncStatus.quotaExceeded
                  ? 'Daily Firestore free-tier quota reached. Data continues saving locally in this browser.'
                  : syncStatus.lastError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={firestoreConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm h-10 px-5 hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Open Firestore Visitors
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>

            {events.length > 0 && (
              <button
                type="button"
                onClick={clearLocalSessionEvents}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 text-muted-foreground font-semibold text-xs sm:text-sm h-10 px-4 cursor-pointer hover:text-foreground hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                Clear Local Cache
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

        {/* Owner Firestore Visitors Directory */}
        <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Firestore Stored Visitors (<code className="text-primary">/visitors/&#123;visitorId&#125;</code>)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every visitor has one permanent ID; returning visits increment{' '}
                <code className="text-primary">visitCount</code> and append new events inside{' '}
                <code className="text-primary">/visitors/&#123;visitorId&#125;/events</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!authUser ? (
                <button
                  type="button"
                  onClick={() => void handleSignInOwner()}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 h-9 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Admin Sign In ({ADMIN_EMAIL})
                </button>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground font-mono">
                    {authUser.email}
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => void loadVisitors()}
                      disabled={loadingVisitors}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 h-9 text-xs font-semibold text-foreground hover:border-primary/50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loadingVisitors ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void signOutUser()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 h-9 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>

          {adminError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 font-mono break-all">
              {adminError}
            </div>
          )}

          {!authUser && (
            <p className="text-xs text-muted-foreground">
              Visitor profiles in Firestore are restricted to the verified owner account (
              <code className="text-foreground">{ADMIN_EMAIL}</code>). Sign in above to inspect all
              returning visitor timelines from Firestore, or browse your own live browser session
              below.
            </p>
          )}

          {authUser && !isOwner && (
            <p className="text-xs text-amber-300">
              Signed in as <code className="font-mono">{authUser.email}</code>. Only{' '}
              <code className="font-mono">{ADMIN_EMAIL}</code> is authorized to read all Firestore
              visitors.
            </p>
          )}

          {isOwner && (
            <div className="space-y-3">
              {visitors.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">
                  {loadingVisitors
                    ? 'Loading visitors from Firestore...'
                    : 'No visitor records found in Firestore yet.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visitors.map((v) => {
                    const isSelected = selectedVisitor?.visitorId === v.visitorId;
                    return (
                      <div
                        key={v.visitorId}
                        className={`rounded-xl border p-3.5 transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/[0.07]'
                            : 'border-white/10 bg-black/40 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedVisitor(v)}
                            className="text-left min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="font-mono text-xs font-semibold text-primary truncate">
                              {v.visitorId}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                              {v.visitCount} {v.visitCount === 1 ? 'visit' : 'visits'} ·{' '}
                              {v.totalEvents} events · {v.deviceType}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteVisitor(v.visitorId)}
                            aria-label={`Delete ${v.visitorId}`}
                            className="text-muted-foreground hover:text-red-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/10 text-xs space-y-1">
                          {v.deviceSummary && (
                            <div className="text-[11px] text-zinc-300 truncate">{v.deviceSummary}</div>
                          )}
                          <div className="text-foreground font-medium truncate">
                            {v.lastLabel || v.lastEventName}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            Top Interest: {INTEREST_LABELS[v.lastInterestCategory] ?? v.lastInterestCategory} ·{' '}
                            {formatTime(v.lastSeenAtMs)}
                          </div>
                          {v.exploredOptions.length > 0 && (
                            <div className="text-[11px] text-zinc-400 truncate">
                              Explored ({v.exploredOptions.length}): {v.exploredOptions.slice(0, 3).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedVisitor && (
                <div className="rounded-xl border border-primary/25 bg-black/50 p-4 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      Inspecting Firestore History for{' '}
                      <code className="font-mono text-primary">{selectedVisitor.visitorId}</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitor(null)}
                      className="text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Switch back to current browser events
                    </button>
                  </div>
                  <div className="text-muted-foreground">
                    Screens visited: {selectedVisitor.visitedScreens.join(', ') || '—'}
                  </div>
                  <div className="text-muted-foreground">
                    All explored options: {selectedVisitor.exploredOptions.join(' · ') || '—'}
                  </div>
                  {loadingVisitorEvents && (
                    <div className="text-primary">Loading nested events from Firestore...</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explored Options Summary for Current Browser */}
        {!selectedVisitor && exploredOptions.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 space-y-2">
            <h3 className="text-sm font-bold text-foreground">
              Options &amp; Sections Recorded Under Your User ID ({exploredOptions.length})
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {exploredOptions.join(' · ')}
            </p>
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
                placeholder="Search event, option, screen..."
                className="w-full h-10 rounded-xl border border-white/15 bg-[#110f0f] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Logged Events</span>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground tabular-nums">
              {metrics.total}
            </div>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {metrics.optionsLoaded} home/page options loaded
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Screens Viewed</span>
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
              <span>Option &amp; Button Clicks</span>
              <MousePointerClick className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground tabular-nums">
              {metrics.clicks}
            </div>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {metrics.topButtons[0] ? `Top: ${metrics.topButtons[0].label}` : 'No clicks yet'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Booking &amp; Trial Intent</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-3xl font-bold text-primary tabular-nums">
              {metrics.bookingIntent}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Trial modals, WhatsApp &amp; forms
            </p>
          </div>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-10 text-center space-y-2">
            <Activity className="h-7 w-7 text-primary mx-auto" />
            <h3 className="text-lg font-bold text-foreground">No matching events yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Scroll through the Home page or open any program card and every loaded option and
              click will be stored under your persistent Visitor ID.
            </p>
          </div>
        )}

        {/* Breakdown Grids */}
        {filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#110f0f] p-5 sm:p-6">
              <h3 className="text-base font-bold text-foreground">Visitor Interest Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-5">
                Summarized under <code className="text-primary">lastInterestCategory</code> for fast
                lead understanding
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
              <h3 className="text-base font-bold text-foreground">Course &amp; Age-Group Focus</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-5">
                Programs viewed, loaded, or clicked by this visitor
              </p>

              {metrics.topCourses.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  Scroll past or click any course card or age tier to see course demand here.
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
              <h3 className="text-base font-bold text-foreground">Screens Visited</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                Routes stored under the visitor’s profile
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
              <h3 className="text-base font-bold text-foreground">
                Loaded Options &amp; Clicked Actions
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                Every option viewed on Home or clicked by this visitor
              </p>

              {metrics.topButtons.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No option events match the current filter.
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

        {/* Complete Chronological Event Timeline */}
        {filteredEvents.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#110f0f] overflow-hidden">
            <div className="p-5 sm:px-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Visitor Event Timeline (
                  <code className="text-primary">
                    /visitors/{selectedVisitor ? selectedVisitor.visitorId : identity.visitorId}/events
                  </code>
                  )
                </h3>
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(filteredEvents.length, 80)} most recent recorded events
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
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Visit #</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Type</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Event Name</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Screen</th>
                    <th className="py-3 px-4 font-semibold">Option / Label</th>
                    <th className="py-3 px-4 font-semibold whitespace-nowrap">Interest</th>
                    <th className="py-3 px-4 font-semibold">Course / Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredEvents.slice(0, 80).map((ev) => (
                    <tr key={ev.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-4 text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatTime(ev.createdAtMs)}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground tabular-nums whitespace-nowrap">
                        #{ev.visitNumber}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                        {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-primary whitespace-nowrap">
                        {ev.eventName}
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
                        {ev.course || ev.metadata || '—'}
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
