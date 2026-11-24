import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Maximize2,
  Minimize2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Link, usePathname } from '../../lib/router';
import { useBookingModal } from '../../lib/bookingContext';
import { inferInterestCategory, trackEvent } from '../../lib/analytics';
import { ASSETS } from '../../data/siteData';

interface NavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DRAWER_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programs' },
  { to: '/kids-program', label: 'Kids Spoken English' },
  { to: '/english', label: 'English Courses' },
  { to: '/about', label: 'Our difference' },
  { to: '/journey', label: 'Your journey' },
  { to: '/stories', label: 'Student voices' },
  { to: '/certificates', label: 'Certificates' },
  { to: '/teachers', label: 'Our teachers' },
  { to: '/contact', label: 'Book free trial' },
];

export function NavDrawer({ open, onOpenChange }: NavDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    trackEvent({
      eventType: 'modal_open',
      eventName: 'open_nav_drawer',
      label: 'Navigation Menu Drawer',
      interestCategory: 'general_info',
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 h-full w-[min(84vw,22rem)] border-r border-white/10 bg-[#09090b]/95 backdrop-blur-xl p-6 shadow-2xl overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground cursor-pointer transition-colors hover:bg-white/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            <h2 className="text-lg font-bold text-foreground font-display pr-8">
              Language Spoken House
            </h2>
            <p className="text-sm text-primary mt-1 font-medium">Explore the house</p>

            <nav className="drawer-links" onClick={() => onOpenChange(false)}>
              {DRAWER_LINKS.map((item, idx) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + idx * 0.025, duration: 0.22 }}
                >
                  <Link
                    to={item.to}
                    className={`block ${pathname === item.to ? 'drawer-active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface PreviewImage {
  name: string;
  url: string;
  course?: string;
}

interface ImageDialogProps {
  preview: PreviewImage | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ImageDialog({ preview, onClose, onPrev, onNext }: ImageDialogProps) {
  const { openBookingModal } = useBookingModal();

  useEffect(() => {
    if (!preview) return;
    trackEvent({
      eventType: 'modal_open',
      eventName: 'open_image_preview',
      label: preview.name,
      interestCategory: inferInterestCategory({
        text: preview.name,
        course: preview.course,
        screen: window.location.pathname,
      }),
      course: preview.course,
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [preview, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 grid w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain gap-4 border border-white/15 bg-card p-4 sm:p-6 shadow-2xl rounded-2xl image-dialog"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="image-dialog-title"
                className="text-base sm:text-lg font-semibold leading-snug tracking-tight text-foreground"
              >
                {preview.name}
              </h2>

              <div className="flex items-center gap-1.5 shrink-0">
                {onPrev && (
                  <button
                    type="button"
                    onClick={onPrev}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-foreground cursor-pointer transition-colors hover:border-primary/40 hover:text-primary"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-foreground cursor-pointer transition-colors hover:border-primary/40 hover:text-primary"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-muted-foreground cursor-pointer transition-colors hover:bg-white/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>

            <p className="sr-only">Course poster or student certificate</p>

            <motion.img
              key={preview.url}
              initial={{ opacity: 0.5, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={preview.url}
              alt={preview.name}
              referrerPolicy="no-referrer"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
              <p className="text-xs text-muted-foreground">
                1-day free trial class · Live online small batches (6–8 students)
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-foreground font-semibold text-xs sm:text-sm h-10 px-4 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  data-track-name="image_dialog_enroll"
                  data-track-label={`Enroll Now (${preview.name})`}
                  data-track-course={preview.course}
                  onClick={() => {
                    const targetCourse = preview.course;
                    onClose();
                    openBookingModal(targetCourse);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm h-10 px-5 shadow-[0_8px_24px_rgba(188,239,18,0.28)] cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  Enroll Now <ArrowRight className="h-4 w-4 shrink-0" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const WELCOME_SESSION_KEY = 'lsh_welcome_modal_dismissed';

const FEE_OPTIONS = [
  {
    id: 'ages-4-6',
    label: 'AGES 4 TO 6',
    title: 'Ages 4 to 6',
    price: 'Rs. 133/Day',
    sub: '20 Classes · Rs. 2,660',
    courseOption: 'Kids Spoken English Program (Ages 4–6 · Rs. 133/Day)',
  },
  {
    id: 'ages-7-9',
    label: 'AGES 7 TO 9',
    title: 'Ages 7 to 9',
    price: 'Rs. 145/Day',
    sub: '20 Classes · Rs. 2,900',
    courseOption: 'Kids Spoken English Program (Ages 7–9 · Rs. 145/Day)',
  },
  {
    id: 'ages-10-14',
    label: 'AGES 10 TO 14',
    title: 'Ages 10 to 14',
    price: 'Rs. 155/Day',
    sub: '20 Classes · Rs. 3,100',
    courseOption: 'Kids Spoken English Program (Ages 10–14 · Rs. 155/Day)',
  },
] as const;

export function WelcomeDemoModal() {
  const { openBookingModal } = useBookingModal();
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(WELCOME_SESSION_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [selectedId, setSelectedId] = useState<(typeof FEE_OPTIONS)[number]['id']>('ages-4-6');
  const [posterExpanded, setPosterExpanded] = useState(false);

  const handleClose = () => {
    setOpen(false);
    trackEvent({
      eventType: 'modal_close',
      eventName: 'close_welcome_demo_modal',
      label: 'Dismiss Kids Welcome Modal',
      interestCategory: 'kids_program',
    });
    try {
      sessionStorage.setItem(WELCOME_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (!open) return;
    trackEvent({
      eventType: 'modal_open',
      eventName: 'open_welcome_demo_modal',
      label: 'Kids Welcome Demo Modal',
      interestCategory: 'kids_program',
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const activeTier = FEE_OPTIONS.find((item) => item.id === selectedId) ?? FEE_OPTIONS[0];
  const handleBookDemoClick = () => {
    trackEvent({
      eventType: 'button_click',
      eventName: 'welcome_modal_book_demo',
      label: `Book Free Demo (${activeTier.title})`,
      interestCategory: 'kids_program',
      course: activeTier.courseOption,
    });
    setOpen(false);
    try {
      sessionStorage.setItem(WELCOME_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
    openBookingModal(activeTier.courseOption);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-demo-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-[580px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl border border-primary/25 bg-[#0b0d09]/95 p-4 sm:p-7 shadow-[0_24px_90px_rgba(0,0,0,0.88)]"
          >
            <button
              type="button"
              onClick={handleClose}
              data-track-explicit="true"
              className="absolute right-3 top-3 sm:right-3.5 sm:top-3.5 rounded-full bg-white/10 p-2 text-muted-foreground cursor-pointer transition-colors hover:bg-white/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold mb-2.5 px-8 text-primary">
              <span className="inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 shrink-0" />
                Live Google Meet
              </span>
              <span aria-hidden="true" className="text-white/30">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 text-foreground/90">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                7–8 Students per Session
              </span>
            </div>

            <h2
              id="welcome-demo-title"
              className="text-center text-xl sm:text-3xl font-bold font-display leading-tight text-foreground"
            >
              Kids Spoken <span className="text-primary">English Program</span>
            </h2>
            <p className="text-center text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 max-w-md mx-auto leading-relaxed">
              Fun Learning · Real Confidence — 1-hour live interactive sessions (Monday to Friday)
              for ages 4 to 14.
            </p>

            <div className="relative mt-3 sm:mt-4 rounded-xl overflow-hidden border border-white/10 bg-[#110f0f]">
              <img
                src={ASSETS.kidsWelcomePoster}
                alt="The Language Spoken House — Kids Spoken English Program"
                className={`w-full object-contain mx-auto block transition-all duration-300 ${
                  posterExpanded ? 'max-h-[460px]' : 'max-h-[205px] sm:max-h-[270px]'
                }`}
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setPosterExpanded((prev) => !prev)}
                data-track-name="welcome_poster_zoom"
                data-track-interest="kids_program"
                className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-black/75 border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur-md cursor-pointer hover:border-primary/50 hover:text-primary transition-colors"
                aria-label={posterExpanded ? 'Shrink poster' : 'Expand poster'}
              >
                {posterExpanded ? (
                  <>
                    <Minimize2 className="h-3 w-3" /> Fit
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3 w-3" /> Zoom
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] font-medium text-muted-foreground text-center mt-3">
              Select your child’s age group:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 mt-2">
              {FEE_OPTIONS.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(opt.id);
                      trackEvent({
                        eventType: 'tab_select',
                        eventName: `select_welcome_tier_${opt.id}`,
                        label: `${opt.title} (${opt.price})`,
                        interestCategory: 'kids_program',
                        course: opt.courseOption,
                      });
                    }}
                    data-track-explicit="true"
                    aria-pressed={isSelected}
                    className={`relative rounded-xl border px-3 py-2.5 text-center cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? 'border-primary bg-primary/12 shadow-[0_0_0_1px_rgba(188,239,18,0.28)]'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold tracking-wider text-primary">
                      {isSelected && <Check className="h-3 w-3 shrink-0" />}
                      <span>{opt.label}</span>
                    </div>
                    <div className="text-sm font-bold text-foreground mt-0.5 tabular-nums">
                      {opt.price}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground mt-3">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" /> 1 Hour Session
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" /> Monday to Friday
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 sm:mt-5">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBookDemoClick}
                data-track-explicit="true"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm h-11 px-5 shadow-[0_8px_24px_rgba(188,239,18,0.28)] cursor-pointer hover:bg-primary/90 transition-colors"
              >
                Book Free Demo <ArrowRight className="h-4 w-4 shrink-0" />
              </motion.button>
              <button
                type="button"
                onClick={handleClose}
                data-track-explicit="true"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-foreground font-semibold text-sm h-11 px-5 cursor-pointer hover:bg-white/10 transition-colors"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-3 tabular-nums">
              Selected: <span className="text-primary font-semibold">{activeTier.title}</span> ·{' '}
              {activeTier.price} · 1 Day Free Trial Class
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
