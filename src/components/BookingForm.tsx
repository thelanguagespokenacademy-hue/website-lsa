import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  COURSE_OPTIONS,
  EMAIL_DISPLAY,
  EMAIL_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../data/siteData';
import { useBookingModal } from '../lib/bookingContext';
import { inferInterestCategory, trackEvent } from '../lib/analytics';

interface BookingFormState {
  studentName: string;
  parentName: string;
  age: string;
  education: string;
  customEducation: string;
  course: string;
  phone: string;
  city: string;
  notes: string;
}

interface FormErrors {
  studentName?: string;
  age?: string;
  education?: string;
  customEducation?: string;
  phone?: string;
}

const EDUCATION_OPTIONS = [
  'Pre-School / KG',
  'Primary (Grade 1–5)',
  'Middle (Grade 6–8)',
  'Matric / O-Levels',
  'Intermediate / Graduate',
  'Teacher / Working Woman',
  'Other',
];

function resolveInitialCourse(requested?: string): string {
  if (!requested) return COURSE_OPTIONS[0];
  const exact = COURSE_OPTIONS.find((item) => item === requested);
  if (exact) return exact;
  const fuzzy = COURSE_OPTIONS.find((item) =>
    item.toLowerCase().includes(requested.toLowerCase())
  );
  return fuzzy ?? requested;
}

function getEffectiveEducation(form: BookingFormState): string {
  return form.education === 'Other' ? form.customEducation.trim() : form.education.trim();
}

function buildRegistrationMessage(form: BookingFormState): string {
  const educationLabel = getEffectiveEducation(form);
  const lines = [
    'Assalam-o-Alaikum! I would like to register / book a Free Trial Demo Class at Language Spoken House.',
    '',
    `• Program: ${form.course}`,
    `• Student Name: ${form.studentName.trim()}`,
    ...(form.parentName.trim() ? [`• Parent / Guardian: ${form.parentName.trim()}`] : []),
    `• Age: ${form.age.trim()} years`,
    `• Education / Level: ${educationLabel}`,
    `• Contact / WhatsApp: ${form.phone.trim()}`,
    ...(form.city.trim() ? [`• City / Country: ${form.city.trim()}`] : []),
    ...(form.notes.trim() ? [`• Learning Goal: ${form.notes.trim()}`] : []),
  ];
  return lines.join('\n');
}

function buildWhatsAppUrl(form: BookingFormState): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(buildRegistrationMessage(form))}`;
}

function buildEmailUrl(form: BookingFormState): string {
  const subject = `Free Trial Demo Registration — ${form.studentName.trim() || 'Student'}`;
  return `${EMAIL_URL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    buildRegistrationMessage(form)
  )}`;
}

export function BookingForm({
  initialCourse,
  onCompleted,
  compact = false,
}: {
  initialCourse?: string;
  onCompleted?: () => void;
  compact?: boolean;
}) {
  const waAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const resolvedCourse = resolveInitialCourse(initialCourse);

  const courseSelectOptions = useMemo(() => {
    if (COURSE_OPTIONS.includes(resolvedCourse)) return COURSE_OPTIONS;
    return [resolvedCourse, ...COURSE_OPTIONS];
  }, [resolvedCourse]);

  const [form, setForm] = useState<BookingFormState>({
    studentName: '',
    parentName: '',
    age: '',
    education: '',
    customEducation: '',
    course: resolvedCourse,
    phone: '',
    city: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, course: resolvedCourse }));
    setSubmitted(false);
    setErrors({});
  }, [resolvedCourse]);

  const whatsappHref = useMemo(() => buildWhatsAppUrl(form), [form]);
  const emailHref = useMemo(() => buildEmailUrl(form), [form]);

  const updateField = <K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (form.studentName.trim().length < 2) {
      next.studentName = 'Please enter the student name.';
    }
    const ageNum = Number(form.age.trim());
    if (!form.age.trim() || Number.isNaN(ageNum) || ageNum < 3 || ageNum > 85) {
      next.age = 'Enter a valid age (3–85).';
    }
    if (!form.education) {
      next.education = 'Please select education or class.';
    } else if (form.education === 'Other' && form.customEducation.trim().length < 2) {
      next.customEducation = 'Please specify your education or class.';
    }
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 9) {
      next.phone = 'Enter a valid WhatsApp / phone number.';
    }
    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      trackEvent({
        eventType: 'button_click',
        eventName: 'booking_validation_error',
        label: 'Continue to WhatsApp (Validation Incomplete)',
        interestCategory: 'trial_booking',
        course: form.course,
        metadata: `missing:${Object.keys(validationErrors).join(',')}`,
      });
      return;
    }
    setErrors({});
    setSubmitted(true);
    trackEvent({
      eventType: 'form_submit',
      eventName: 'submit_whatsapp_booking',
      label: `Submit Free Trial (${form.course})`,
      interestCategory: inferInterestCategory({
        course: form.course,
        text: form.course,
        screen: window.location.pathname,
      }),
      course: form.course,
      metadata: form.education ? `education:${form.education}` : undefined,
    });
    waAnchorRef.current?.click();
  };

  return (
    <div>
      <a
        ref={waAnchorRef}
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      >
        Open WhatsApp
      </a>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="submitted-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 sm:p-6 text-center"
          >
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/20 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground font-display">
              Details Ready for WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
              Your registration summary for <span className="text-foreground font-semibold">{form.studentName}</span> is prepared. Tap below if WhatsApp didn’t open automatically.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3.5 text-left text-xs text-muted-foreground space-y-1.5">
              <div>
                <span className="text-primary font-semibold">Program:</span> {form.course}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <span className="text-primary font-semibold">Student:</span> {form.studentName}
                </span>
                <span>
                  <span className="text-primary font-semibold">Age:</span> {form.age}
                </span>
                <span>
                  <span className="text-primary font-semibold">Education:</span>{' '}
                  {getEffectiveEducation(form)}
                </span>
              </div>
              {form.parentName.trim() && (
                <div>
                  <span className="text-primary font-semibold">Parent / Guardian:</span>{' '}
                  {form.parentName}
                </div>
              )}
              <div>
                <span className="text-primary font-semibold">Phone:</span> {form.phone}
                {form.city.trim() ? ` · ${form.city}` : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                onClick={onCompleted}
                data-track-name="outbound_whatsapp_send"
                data-track-label={`Send on WhatsApp (${form.course})`}
                data-track-interest="trial_booking"
                data-track-course={form.course}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm min-h-11 py-2.5 px-4 shadow-[0_8px_24px_rgba(188,239,18,0.28)] hover:bg-primary/90 transition-colors text-center"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span className="inline-flex flex-wrap items-center justify-center gap-x-1">
                  <span>Send on WhatsApp</span>
                  <span className="whitespace-nowrap">({WHATSAPP_DISPLAY})</span>
                </span>
              </a>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                data-track-name="btn_edit_booking_details"
                data-track-interest="trial_booking"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 text-foreground font-semibold text-sm min-h-11 py-2.5 px-5 cursor-pointer hover:bg-white/10 transition-colors"
              >
                Edit Details
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <a
                href={emailHref}
                data-track-name="outbound_email_booking"
                data-track-label={`Send via Email (${form.course})`}
                data-track-interest="contact"
                data-track-course={form.course}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>Or send via Email: {EMAIL_DISPLAY}</span>
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="intake-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-3.5"
          >
            <div>
              <label
                htmlFor="booking-course"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Program / Course *
              </label>
              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <select
                  id="booking-course"
                  value={form.course}
                  onChange={(e) => {
                    const nextCourse = e.target.value;
                    updateField('course', nextCourse);
                    trackEvent({
                      eventType: 'tab_select',
                      eventName: 'select_booking_program',
                      label: `Program: ${nextCourse}`,
                      interestCategory: inferInterestCategory({
                        course: nextCourse,
                        text: nextCourse,
                        screen: window.location.pathname,
                      }),
                      course: nextCourse,
                    });
                  }}
                  className="w-full h-11 appearance-none rounded-xl border border-white/15 bg-[#110f0f] pl-10 pr-10 text-base sm:text-sm text-foreground truncate focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors cursor-pointer"
                >
                  {courseSelectOptions.map((option) => (
                    <option key={option} value={option} className="bg-[#110f0f] text-foreground">
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="booking-student-name"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Student Name *
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    id="booking-student-name"
                    type="text"
                    required
                    placeholder="e.g. Ayesha Khan"
                    value={form.studentName}
                    onChange={(e) => updateField('studentName', e.target.value)}
                    className={`w-full h-11 rounded-xl border bg-[#110f0f] pl-10 pr-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors ${
                      errors.studentName ? 'border-red-400' : 'border-white/15 focus:border-primary'
                    }`}
                  />
                </div>
                {errors.studentName && (
                  <p className="text-[11px] text-red-400 mt-1">{errors.studentName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-parent-name"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Parent / Guardian Name
                </label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    id="booking-parent-name"
                    type="text"
                    placeholder="For kids (or Self)"
                    value={form.parentName}
                    onChange={(e) => updateField('parentName', e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/15 bg-[#110f0f] pl-10 pr-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="booking-age"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Age (Years) *
                </label>
                <input
                  id="booking-age"
                  type="number"
                  min={3}
                  max={85}
                  required
                  placeholder="e.g. 9"
                  value={form.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className={`w-full h-11 rounded-xl border bg-[#110f0f] px-3.5 text-base sm:text-sm text-foreground tabular-nums placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors ${
                    errors.age ? 'border-red-400' : 'border-white/15 focus:border-primary'
                  }`}
                />
                {errors.age && <p className="text-[11px] text-red-400 mt-1">{errors.age}</p>}
              </div>

              <div>
                <label
                  htmlFor="booking-education"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Education / Class *
                </label>
                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <select
                    id="booking-education"
                    required
                    value={form.education}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField('education', val);
                      if (val !== 'Other') {
                        updateField('customEducation', '');
                      }
                      trackEvent({
                        eventType: 'tab_select',
                        eventName: 'select_education_level',
                        label: `Education: ${val}`,
                        interestCategory: inferInterestCategory({
                          text: val,
                          course: form.course,
                          screen: window.location.pathname,
                        }),
                        course: form.course,
                        metadata: val,
                      });
                    }}
                    className={`w-full h-11 appearance-none rounded-xl border bg-[#110f0f] pl-10 pr-10 text-base sm:text-sm truncate focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors cursor-pointer ${
                      form.education ? 'text-foreground' : 'text-muted-foreground/70'
                    } ${errors.education ? 'border-red-400' : 'border-white/15 focus:border-primary'}`}
                  >
                    <option value="" disabled className="bg-[#110f0f] text-muted-foreground">
                      Select education / class
                    </option>
                    {EDUCATION_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-[#110f0f] text-foreground">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.education && (
                  <p className="text-[11px] text-red-400 mt-1">{errors.education}</p>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {form.education === 'Other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <label
                    htmlFor="booking-custom-education"
                    className="block text-xs font-semibold text-foreground mb-1.5"
                  >
                    Specify Education / Class *
                  </label>
                  <input
                    id="booking-custom-education"
                    type="text"
                    required
                    placeholder="Enter your class, grade, or background"
                    value={form.customEducation}
                    onChange={(e) => updateField('customEducation', e.target.value)}
                    className={`w-full h-11 rounded-xl border bg-[#110f0f] px-3.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors ${
                      errors.customEducation
                        ? 'border-red-400'
                        : 'border-white/15 focus:border-primary'
                    }`}
                  />
                  {errors.customEducation && (
                    <p className="text-[11px] text-red-400 mt-1">{errors.customEducation}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="booking-phone"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Your WhatsApp / Phone *
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    id="booking-phone"
                    type="tel"
                    required
                    placeholder="+92 3XX XXXXXXX"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={`w-full h-11 rounded-xl border bg-[#110f0f] pl-10 pr-3 text-base sm:text-sm text-foreground tabular-nums placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors ${
                      errors.phone ? 'border-red-400' : 'border-white/15 focus:border-primary'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-red-400 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label
                  htmlFor="booking-city"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  City / Country
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    id="booking-city"
                    type="text"
                    placeholder="e.g. Lahore, UAE, UK"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/15 bg-[#110f0f] pl-10 pr-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors"
                  />
                </div>
              </div>
            </div>

            {!compact && (
              <div>
                <label
                  htmlFor="booking-notes"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Speaking Goal / Notes (Optional)
                </label>
                <textarea
                  id="booking-notes"
                  rows={2}
                  placeholder="Share preferred timing or speaking goals..."
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#110f0f] p-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 transition-colors resize-none"
                />
              </div>
            )}

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              data-track-explicit="true"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm min-h-12 py-2.5 px-4 sm:px-6 shadow-[0_10px_28px_rgba(188,239,18,0.28)] cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 text-center leading-snug">
                <span>Continue to WhatsApp</span>
                <span className="whitespace-nowrap">({WHATSAPP_DISPLAY})</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </motion.button>

            <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
              Your details will be pre-filled in WhatsApp for your 1-day free trial demo, or reach
              us at{' '}
              <a
                href={EMAIL_URL}
                data-track-name="outbound_email_link"
                data-track-interest="contact"
                className="text-primary hover:underline font-medium"
              >
                {EMAIL_DISPLAY}
              </a>
              .
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BookingModal() {
  const { open, defaultCourse, closeBookingModal } = useBookingModal();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeBookingModal();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, closeBookingModal]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={closeBookingModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-[600px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl border border-primary/25 bg-[#0b0d09]/95 p-4 sm:p-7 shadow-[0_24px_90px_rgba(0,0,0,0.88)]"
          >
            <button
              type="button"
              onClick={closeBookingModal}
              data-track-explicit="true"
              className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full bg-white/10 p-2 text-muted-foreground cursor-pointer transition-colors hover:bg-white/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 pr-8">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Free Trial &amp; Enrollment
              </span>
              <h2
                id="booking-modal-title"
                className="text-xl sm:text-2xl font-bold font-display text-foreground mt-1"
              >
                Student &amp; Parent <span className="text-primary">Details</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Enter your details below to open WhatsApp ({WHATSAPP_DISPLAY}) with your booking
                info ready.
              </p>
            </div>

            <BookingForm initialCourse={defaultCourse} onCompleted={closeBookingModal} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
