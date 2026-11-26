import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  Mail,
  MessageCircle,
  Mic,
  Phone,
  Play,
  Users,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Link } from '../lib/router';
import { useBookingModal } from '../lib/bookingContext';
import { useRegionPricing } from '../lib/regionContext';
import { inferInterestCategory, trackEvent } from '../lib/analytics';
import { CountryPriceBar } from './CountryPriceBar';
import { Button } from './ui/Button';
import { FadeInUp } from './ui/FadeInUp';
import { ImageDialog, type PreviewImage } from './ui/Modal';
import {
  ASSETS,
  CERTIFICATES,
  CLASSWORK_PILLARS,
  CLASSWORK_VIDEOS,
  EMAIL_DISPLAY,
  EMAIL_URL,
  HERO_SLIDES,
  PHONE_URL,
  SPOKEN_ENGLISH_SKILLS,
  WHATSAPP_DISPLAY,
} from '../data/siteData';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VIEWPORT_ONCE = { once: true, amount: 0.05 } as const;

export function PageTitle({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="shell page-title"
    >
      <Link to="/" className="back-link">
        <ArrowLeft size={14} /> Back to the house
      </Link>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
    </motion.div>
  );
}

export function EnrollButton({
  course,
  label = 'Enroll',
}: {
  course?: string;
  label?: string;
}) {
  const { openBookingModal } = useBookingModal();
  const interest = inferInterestCategory({ course: course ?? '', text: label });

  return (
    <Button
      type="button"
      onClick={() => openBookingModal(course)}
      data-track-name={`cta_enroll_${(course || label).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`}
      data-track-label={course ? `${label} — ${course}` : label}
      data-track-course={course}
      data-track-interest={interest}
    >
      {label}
      <ArrowRight />
    </Button>
  );
}

export function HeroSlider() {
  const { region } = useRegionPricing();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slide = HERO_SLIDES[index] ?? HERO_SLIDES[0];

  const goNext = () => {
    const nextIdx = (index + 1) % HERO_SLIDES.length;
    setIndex(nextIdx);
    trackEvent({
      eventType: 'slide_change',
      eventName: 'hero_slide_next',
      label: `Hero Slide ${nextIdx + 1}: ${HERO_SLIDES[nextIdx]?.title ?? ''}`,
      interestCategory: 'general_info',
      metadata: `slide_${nextIdx + 1}`,
    });
  };
  const goPrev = () => {
    const prevIdx = (index + HERO_SLIDES.length - 1) % HERO_SLIDES.length;
    setIndex(prevIdx);
    trackEvent({
      eventType: 'slide_change',
      eventName: 'hero_slide_prev',
      label: `Hero Slide ${prevIdx + 1}: ${HERO_SLIDES[prevIdx]?.title ?? ''}`,
      interestCategory: 'general_info',
      metadata: `slide_${prevIdx + 1}`,
    });
  };

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [paused, index]);

  if (!slide) return null;

  return (
    <section
      className={`hero ${paused ? 'hero-paused' : ''}`}
      id="home"
      data-track-view="home_hero_banner"
      data-track-label={`Hero Banner: ${slide.title}`}
      data-track-section="home"
      data-track-interest="general_info"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = endX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) > 42) {
          if (delta < 0) goNext();
          else goPrev();
        }
      }}
    >
      <div className="hero-glow" aria-hidden="true" />

      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={slide.image}
          className="hero-image"
          src={slide.image}
          alt={slide.title}
          referrerPolicy="no-referrer"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.62, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.95, ease: EASE_OUT_EXPO }}
        />
      </AnimatePresence>

      <div className="shell hero-shell">
        <div className="hero-top-bar">
          <span className="live-label">
            <span>Live Online</span>
            <span aria-hidden="true" className="text-primary">
              ·
            </span>
            <span>Mon–Fri</span>
            <span aria-hidden="true" className="text-primary">
              ·
            </span>
            <span className="tabular-nums">6 Learners / Batch</span>
            <span aria-hidden="true" className="text-primary">
              ·
            </span>
            <span>Urdu &amp; English</span>
          </span>
        </div>

        <div className="hero-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="hero-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            >
              <span className="eyebrow">Language Spoken House</span>
              <h1>{slide.title}</h1>
              <p className="hero-description">{slide.text}</p>
              <div className="hero-actions">
                <Button size="lg" asChild>
                  <Link
                    to="/contact"
                    data-track-name="hero_book_free_demo"
                    data-track-interest="trial_booking"
                    data-track-meta={`slide_${index + 1}`}
                  >
                    Book your free demo <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="hero" asChild>
                  <Link
                    to="/programs"
                    data-track-name="hero_view_programs"
                    data-track-interest="general_info"
                    data-track-meta={`slide_${index + 1}`}
                  >
                    View programs
                  </Link>
                </Button>
              </div>

              <div className="mt-7 pt-5 border-t border-white/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-300 tabular-nums">
                <Link
                  to="/kids-program"
                  data-track-name="hero_quick_kids"
                  data-track-interest="kids_program"
                  className="hover:text-primary transition-colors whitespace-nowrap"
                >
                  <span className="text-primary mr-1.5">01.</span>
                  Kids (4–14) · {region.monthlyPrice}/mo
                </Link>
                <Link
                  to="/english"
                  data-track-name="hero_quick_women"
                  data-track-interest="womens_program"
                  className="hover:text-primary transition-colors whitespace-nowrap"
                >
                  <span className="text-primary mr-1.5">02.</span>
                  Women’s Fluency · {region.monthlyPrice}/mo
                </Link>
                <Link
                  to="/teachers"
                  data-track-name="hero_quick_teachers"
                  data-track-interest="teacher_track"
                  className="hover:text-primary transition-colors whitespace-nowrap"
                >
                  <span className="text-primary mr-1.5">03.</span>
                  Teacher Track · {region.monthlyPrice}/mo
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hero-bottom">
          <div className="hero-dots" aria-label={`Slide ${index + 1} of ${HERO_SLIDES.length}`}>
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => {
                  setIndex(i);
                  trackEvent({
                    eventType: 'slide_change',
                    eventName: `hero_dot_${i + 1}`,
                    label: `Hero Slide ${i + 1}: ${s.title}`,
                    interestCategory: 'general_info',
                    metadata: `slide_${i + 1}`,
                  });
                }}
                data-track-explicit="true"
                aria-label={`Go to slide ${i + 1}`}
                className={`hero-dot ${i === index ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hero-counter">
              0{index + 1} / 0{HERO_SLIDES.length}
            </span>
            <Button
              variant="hero"
              size="icon"
              aria-label="Previous slide"
              onClick={goPrev}
              data-track-explicit="true"
            >
              <ArrowLeft />
            </Button>
            <Button
              variant="hero"
              size="icon"
              aria-label="Next slide"
              onClick={goNext}
              data-track-explicit="true"
            >
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BenefitsBar() {
  const items = [
    { Icon: Globe, text: '100% Online Learning' },
    { Icon: Video, text: 'Live Classes' },
    { Icon: Users, text: 'Only 6 Students per Batch' },
    { Icon: Award, text: 'Certificate Provided' },
    { Icon: BookOpen, text: 'Urdu & English' },
    { Icon: Heart, text: 'Beginner Friendly' },
    { Icon: Clock, text: '1 Hour Sessions, Mon–Fri' },
  ];

  return (
    <FadeInUp
      className="benefits"
      y={16}
      duration={0.45}
      data-track-view="benefits_bar"
      data-track-label="Key Benefits Strip (100% Online · 6 Students/Batch · Urdu & English)"
      data-track-section="benefits"
      data-track-interest="general_info"
    >
      {items.map(({ Icon, text }) => (
        <span key={text}>
          <Icon />
          {text}
        </span>
      ))}
    </FadeInUp>
  );
}

export function ShowcaseMarquee() {
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const tiles = [
    {
      title: 'Kids English Speaking',
      tag: 'Ages 4–14',
      url: ASSETS.kidsEnglish,
      course: 'Kids English Speaking Course (Ages 4–14)',
    },
    {
      title: 'Women’s Spoken English',
      tag: 'Daily & Work',
      url: ASSETS.womenEnglish,
      course: 'Female English Speaking Course',
    },
    {
      title: 'Kids Spoken Poster',
      tag: 'Mon–Fri · Live',
      url: ASSETS.kidsWelcomePoster,
      course: 'Kids Spoken English Program (Ages 4–6)',
    },
    {
      title: 'Playful Kids Speaking',
      tag: 'Games & Stories',
      url: ASSETS.kidsPoster1,
      course: 'Kids English Speaking Course (Ages 4–14)',
    },
    {
      title: 'Female Fluency Batch',
      tag: 'Small Groups',
      url: ASSETS.womenPoster1,
      course: 'Female English Speaking Course',
    },
    {
      title: 'Global Live Classroom',
      tag: 'Worldwide',
      url: ASSETS.globalClassroom,
      course: 'Free Trial Consultation / General Inquiry',
    },
    {
      title: 'Expert Trainers',
      tag: 'Live Feedback',
      url: ASSETS.teachers,
      course: 'Teacher Communication Track',
    },
  ];

  const activePreview: PreviewImage | null =
    previewIdx !== null && tiles[previewIdx]
      ? {
          name: tiles[previewIdx].title,
          url: tiles[previewIdx].url,
          course: tiles[previewIdx].course,
        }
      : null;

  return (
    <FadeInUp
      className="marquee-band"
      aria-label="Program visual highlights"
      y={20}
      data-track-view="program_visual_highlights"
      data-track-label="Visual Highlights Marquee Loaded"
      data-track-section="showcase"
      data-track-interest="general_info"
    >
      <div className="marquee-mask">
        <div className="marquee-track">
          {[...tiles, ...tiles].map((tile, idx) => (
            <button
              key={`${tile.title}-${idx}`}
              type="button"
              className="marquee-tile"
              onClick={() => setPreviewIdx(idx % tiles.length)}
              data-track-name={`marquee_tile_${tile.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`}
              data-track-label={`Showcase: ${tile.title}`}
              data-track-course={tile.course}
              aria-label={`Preview ${tile.title}`}
            >
              <img src={tile.url} alt={tile.title} loading="lazy" referrerPolicy="no-referrer" />
              <div className="marquee-tile-caption">
                <span>{tile.title}</span>
                <small>{tile.tag}</small>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ImageDialog
        preview={activePreview}
        onClose={() => setPreviewIdx(null)}
        onPrev={() =>
          setPreviewIdx((prev) => (prev === null ? null : (prev + tiles.length - 1) % tiles.length))
        }
        onNext={() =>
          setPreviewIdx((prev) => (prev === null ? null : (prev + 1) % tiles.length))
        }
      />
    </FadeInUp>
  );
}

export function WhoAreYouSection() {
  const paths = [
    {
      index: '01',
      Icon: Users,
      title: 'I’m a parent',
      text: 'I want my child to speak English confidently.',
      to: '/kids-program',
      cta: 'Choose age or level',
    },
    {
      index: '02',
      Icon: Heart,
      title: 'I’m a woman',
      text: 'I want confidence for daily life and work.',
      to: '/english',
      cta: 'Explore women’s program',
    },
    {
      index: '03',
      Icon: GraduationCap,
      title: 'I’m a teacher',
      text: 'I want stronger English and teaching communication.',
      to: '/teachers',
      cta: 'Meet our trainers',
    },
  ];

  return (
    <FadeInUp as="section" className="section" id="audience">
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Start where you are</span>
          <h2 className="section-heading">Who are you here for?</h2>
          <p className="section-intro">
            Choose the path that fits your goal. Every class is live, practical, and built for
            confident speaking.
          </p>
        </FadeInUp>

        <div className="path-grid mt-9">
          {paths.map(({ index, Icon, title, text, to, cta }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.45, delay: i * 0.08, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -4 }}
              className="path"
              data-track-view={`audience_option_${index}`}
              data-track-label={`Option Loaded: ${title} (${cta})`}
              data-track-section="audience"
              data-track-interest={
                to === '/kids-program'
                  ? 'kids_program'
                  : to === '/english'
                    ? 'womens_program'
                    : 'teacher_track'
              }
            >
              <div className="path-top">
                <div className="path-icon-box">
                  <Icon size={20} />
                </div>
                <span className="path-index">{index}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link
                className="text-link"
                to={to}
                data-track-name={`audience_path_${index}`}
                data-track-label={`${title} — ${cta}`}
                data-track-interest={
                  to === '/kids-program'
                    ? 'kids_program'
                    : to === '/english'
                      ? 'womens_program'
                      : 'teacher_track'
                }
              >
                {cta} <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </FadeInUp>
  );
}

export function WhySection() {
  const [showStudentVideo, setShowStudentVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const features = [
    { Icon: Mic, title: 'Speaking first', text: 'Use English from the first class.' },
    {
      Icon: MessageCircle,
      title: 'Practical communication',
      text: 'Practice words you need in real life.',
    },
    {
      Icon: GraduationCap,
      title: 'Live expert guidance',
      text: 'Get patient, personal feedback.',
    },
    { Icon: Globe, title: 'Learn from anywhere', text: 'Join a welcoming online classroom.' },
  ];

  const embedSrc =
    typeof window !== 'undefined'
      ? `${ASSETS.studentDifferenceEmbedUrl}&origin=${encodeURIComponent(window.location.origin)}`
      : ASSETS.studentDifferenceEmbedUrl;

  const sendYouTubeCommand = (func: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  };

  useEffect(() => {
    if (!showStudentVideo) {
      setIsMuted(true);
    }
  }, [showStudentVideo]);

  const handleToggleVideo = () => {
    const nextState = !showStudentVideo;
    setShowStudentVideo(nextState);
    trackEvent({
      eventType: 'button_click',
      eventName: nextState ? 'load_our_difference_video' : 'close_our_difference_video',
      label: nextState
        ? 'Show Student Difference Video'
        : 'Hide Student Difference Video',
      interestCategory: 'stories',
      metadata: 'our_difference_section',
    });
  };

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      sendYouTubeCommand('mute');
    } else {
      sendYouTubeCommand('unMute');
      sendYouTubeCommand('playVideo');
    }
    trackEvent({
      eventType: 'button_click',
      eventName: nextMuted ? 'mute_our_difference_video' : 'unmute_our_difference_video',
      label: nextMuted ? 'Mute Student Video' : 'Unmute Student Video',
      interestCategory: 'stories',
      metadata: 'our_difference_section',
    });
  };

  return (
    <FadeInUp as="section" className="section section-coral" id="why">
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Why Language Spoken House?</span>
          <h2 className="section-heading">
            We don’t just teach English.
            <br />
            We make you speak it.
          </h2>
          <p className="section-intro">
            Speaking is not saved for the end of a lesson. It is how every lesson begins, grows,
            and becomes useful in real life.
          </p>
        </FadeInUp>

        <div className="feature-grid">
          {features.map(({ Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.45, delay: i * 0.07, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -3 }}
              className="feature"
            >
              <div className="feature-icon-box">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.div>
          ))}
        </div>

        {/* Real student proof video shown & auto-playing by default with user toggle */}
        <div
          className="mt-8 rounded-2xl border border-white/10 bg-[#110f0f]/90 p-5 sm:p-7"
          data-track-view="our_difference_student_video"
          data-track-label="Our Difference: Real Student Proof Video Loaded"
          data-track-section="why"
          data-track-interest="stories"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="eyebrow !mb-1">Real Student Proof</span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Hear our students speak with confidence
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Watch real Language Spoken House students share how live classes improved their
                English fluency and confidence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {showStudentVideo && (
                <Button
                  type="button"
                  size="lg"
                  variant={isMuted ? 'default' : 'outline'}
                  onClick={handleToggleSound}
                  data-track-explicit="true"
                >
                  {isMuted ? (
                    <>
                      <Volume2 />
                      Tap for Sound
                    </>
                  ) : (
                    <>
                      <VolumeX />
                      Mute Sound
                    </>
                  )}
                </Button>
              )}

              <Button
                type="button"
                size="lg"
                variant={showStudentVideo ? 'outline' : 'default'}
                onClick={handleToggleVideo}
                data-track-explicit="true"
                aria-expanded={showStudentVideo}
                aria-controls="our-difference-student-video"
              >
                {showStudentVideo ? (
                  <>
                    <X />
                    Hide Video
                  </>
                ) : (
                  <>
                    <Play />
                    Watch Student Video
                  </>
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showStudentVideo && (
              <motion.div
                id="our-difference-student-video"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="overflow-hidden"
              >
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-6 items-center">
                  <div className="mx-auto w-full max-w-[340px] rounded-2xl overflow-hidden border border-primary/25 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
                    <iframe
                      ref={iframeRef}
                      src={embedSrc}
                      title="Language Spoken House Student Speaking Proof"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      onLoad={() => {
                        iframeRef.current?.contentWindow?.postMessage(
                          JSON.stringify({ event: 'listening', id: 1 }),
                          '*'
                        );
                      }}
                      className="w-full aspect-[9/16] max-h-[540px] border-0 bg-black block"
                    />
                  </div>

                  <div className="space-y-4">
                    <span className="eyebrow !mb-0">Live Online Speaking Results</span>
                    <h4 className="text-xl sm:text-2xl font-bold text-foreground">
                      Real students, real progress from home
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                      Every learner starts by speaking from day one in small batches of 6–8
                      students with warm teacher guidance and supportive daily practice.
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm text-foreground/90">
                      <li className="flex items-center gap-2.5">
                        <Check size={15} className="text-primary shrink-0" />
                        Builds natural speaking confidence without hesitation
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check size={15} className="text-primary shrink-0" />
                        Interactive games, storytelling, and real-life conversation
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check size={15} className="text-primary shrink-0" />
                        Try 1 free live trial class before enrolling
                      </li>
                    </ul>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <EnrollButton
                        course="Kids English Speaking Course (Ages 4–14)"
                        label="Book Free Demo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleToggleSound}
                        data-track-explicit="true"
                      >
                        {isMuted ? <Volume2 /> : <VolumeX />}
                        {isMuted ? 'Unmute Sound' : 'Mute Sound'}
                      </Button>
                      <Button asChild variant="outline">
                        <a
                          href={ASSETS.studentDifferenceYoutubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-track-name="our_difference_watch_on_youtube"
                          data-track-label="Watch on YouTube"
                          data-track-interest="stories"
                        >
                          <ExternalLink />
                          Watch on YouTube
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FadeInUp>
  );
}

export function EnglishProgramsSection({ onlyKids = false }: { onlyKids?: boolean }) {
  const { region, countryName } = useRegionPricing();
  const [posterList, setPosterList] = useState<PreviewImage[]>([]);
  const [posterIdx, setPosterIdx] = useState<number | null>(null);

  const courses = [
    {
      name: 'Kids English Speaking Course',
      image: ASSETS.kidsEnglish,
      age: 'Ages 4–14',
      description:
        'Fun speaking, stronger vocabulary, real-life conversations, and interactive activities that help children enjoy using English.',
      bullets: [
        'Games & storytelling-based learning',
        'Only 6 students per batch',
        'Monday–Friday · 1 hour sessions',
        'One-day free trial class',
      ],
      posters: [ASSETS.kidsWelcomePoster, ASSETS.kidsPoster1, ASSETS.kidsPoster2],
    },
    {
      name: 'Female English Speaking Course',
      image: ASSETS.womenEnglish,
      age: 'For ladies & working women',
      description:
        'A women-focused program for daily communication, work, vocabulary, fluency, and the confidence to express yourself.',
      bullets: [
        'Build daily speaking confidence',
        'Only 6 students per batch',
        'Monday–Friday · 1 hour sessions',
        'Basic & Advanced sessions',
      ],
      posters: [ASSETS.womenPoster1, ASSETS.womenPoster2],
    },
  ];

  const activePreview =
    posterIdx !== null && posterList[posterIdx] ? posterList[posterIdx] : null;

  return (
    <FadeInUp as="section" className="section" id="english">
      <div className="shell">
        <FadeInUp className="section-top" y={16}>
          <div>
            <span className="eyebrow">English Speaking Branch</span>
            <h2 className="section-heading">Speak English, Speak Confidently!</h2>
            <p className="section-intro">
              Our spoken English programs for growing voices and everyday confidence.
            </p>
          </div>
          <p className="text-xs font-semibold text-primary whitespace-nowrap shrink-0">
            1-Day Free Trial Class · Live Small Batches
          </p>
        </FadeInUp>

        <CountryPriceBar className="mb-7 rounded-2xl border border-primary/20 bg-[#110f0f]/90 px-4 py-3.5 sm:px-5" />

        <div className="course-grid">
          {courses
            .filter((_, idx) => !onlyKids || idx === 0)
            .map((course, idx) => (
              <motion.article
                key={course.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_ONCE}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -5 }}
                className="course-card"
                data-track-view={`program_card_${course.name.startsWith('Kids') ? 'kids' : 'women'}`}
                data-track-label={`Program Loaded: ${course.name} (${course.age})`}
                data-track-section="english"
                data-track-interest={course.name.startsWith('Kids') ? 'kids_program' : 'womens_program'}
                data-track-course={course.name}
              >
                <div className="media-frame">
                  <img
                    className="course-photo"
                    src={course.image}
                    alt={course.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="course-body">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="eyebrow !mb-0">{course.age}</span>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {countryName} Fee
                    </span>
                  </div>
                  <h3>{course.name}</h3>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-xl border border-primary/20 bg-primary/[0.06] px-3.5 py-2.5">
                    <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                      {region.monthlyPrice}
                    </span>
                    <span className="text-xs font-medium text-zinc-300 tabular-nums">
                      / month · 20 Live Classes ({countryName})
                    </span>
                  </div>
                  <p>{course.description}</p>

                  <ul className="course-bullets">
                    {course.bullets.map((bullet) => (
                      <li key={bullet}>
                        <Check />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div className="course-bottom">
                    <EnrollButton course={course.name} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {region.monthlyPrice}/mo · Mon–Fri
                    </span>
                  </div>

                  <div className="poster-options">
                    {course.posters.map((posterUrl, pIdx) => (
                      <Button
                        key={posterUrl}
                        variant="ghost"
                        className="poster-button"
                        aria-label={`View ${course.name} poster ${pIdx + 1}`}
                        data-track-name={`course_poster_${pIdx + 1}`}
                        data-track-course={course.name}
                        onClick={() => {
                          setPosterList(
                            course.posters.map((url, k) => ({
                              url,
                              name: `${course.name} — Poster ${k + 1}`,
                              course: course.name,
                            }))
                          );
                          setPosterIdx(pIdx);
                        }}
                      >
                        <img
                          src={posterUrl}
                          alt={`${course.name} poster ${pIdx + 1}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </Button>
                    ))}
                    <span className="poster-hint">Tap to view posters</span>
                  </div>

                  {course.name.startsWith('Kids') && !onlyKids && (
                    <Link
                      to="/kids-program"
                      className="text-link"
                      data-track-name="explore_kids_program"
                      data-track-interest="kids_program"
                    >
                      Explore kids program <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </motion.article>
            ))}
        </div>
      </div>

      <ImageDialog
        preview={activePreview}
        onClose={() => setPosterIdx(null)}
        onPrev={
          posterList.length > 1
            ? () =>
                setPosterIdx((prev) =>
                  prev === null ? null : (prev + posterList.length - 1) % posterList.length
                )
            : undefined
        }
        onNext={
          posterList.length > 1
            ? () =>
                setPosterIdx((prev) => (prev === null ? null : (prev + 1) % posterList.length))
            : undefined
        }
      />
    </FadeInUp>
  );
}

export function SpokenSkillsSection() {
  const { region, countryName } = useRegionPricing();
  const [selectedTierIdx, setSelectedTierIdx] = useState(0);

  const kidsTiers = [
    {
      label: 'Ages 4–6',
      fee: `${region.monthlyPrice}/mo`,
      course: 'Kids Spoken English Program (Ages 4–6)',
      summary: 'Playful phonics, everyday words, greetings, and early speaking confidence.',
    },
    {
      label: 'Ages 7–9',
      fee: `${region.monthlyPrice}/mo`,
      course: 'Kids Spoken English Program (Ages 7–9)',
      summary: 'Full-sentence speaking, storytelling games, and natural classroom interaction.',
    },
    {
      label: 'Ages 10–14',
      fee: `${region.monthlyPrice}/mo`,
      course: 'Kids Spoken English Program (Ages 10–14)',
      summary: 'Pronunciation clarity, group discussions, presentations, and fluent conversation.',
    },
  ];
  const activeTier = kidsTiers[selectedTierIdx] ?? kidsTiers[0];

  const speakingTracks = [
    {
      name: 'Kids Spoken English',
      duration: 'Ages 4–14',
      text: 'Games · Storytelling · Real Confidence',
      image: ASSETS.kidsPoster1,
    },
    {
      name: 'Women’s Spoken English',
      duration: 'Basic & Advanced',
      text: 'Daily Life · Work · Clear Fluency',
      image: ASSETS.womenPoster1,
    },
    {
      name: 'Teacher Communication',
      duration: 'For Educators',
      text: 'Classroom Clarity · Live Feedback',
      image: ASSETS.teachers,
    },
  ];

  return (
    <FadeInUp as="section" className="section section-muted" id="skills">
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Communication Tracks</span>
          <h2 className="section-heading">From Hesitation to Fluent Speaking</h2>
          <p className="section-intro">
            Don’t just memorize rules — speak English naturally every day. Practical, interactive
            sessions for kids, women, and teachers.
          </p>
        </FadeInUp>

        <CountryPriceBar className="mt-7 rounded-2xl border border-white/10 bg-[#110f0f]/85 px-4 py-3.5 sm:px-5" />

        <div className="track-grid mt-7">
          {speakingTracks.map((course, idx) => (
            <motion.article
              key={course.name}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -5 }}
              className="track-card"
              data-track-view={`track_option_${idx + 1}`}
              data-track-label={`Track Loaded: ${course.name} (${course.duration})`}
              data-track-section="skills"
              data-track-interest={
                course.name.includes('Kids')
                  ? 'kids_program'
                  : course.name.includes('Women')
                    ? 'womens_program'
                    : 'teacher_track'
              }
              data-track-course={course.name}
            >
              <div className="media-frame">
                <img
                  className="track-poster"
                  src={course.image}
                  alt={course.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="track-body">
                <span className="eyebrow">{course.duration}</span>
                <h3>{course.name}</h3>
                <p>{course.text}</p>
                <div className="mt-3 mb-4 text-sm font-bold text-primary tabular-nums">
                  {region.monthlyPrice}{' '}
                  <span className="text-xs font-medium text-muted-foreground">
                    / month · {countryName}
                  </span>
                </div>
                <EnrollButton course={course.name} />
              </div>
            </motion.article>
          ))}
        </div>

        <FadeInUp y={14}>
          <h3 className="certificate-heading">What You’ll Learn</h3>
        </FadeInUp>
        <div className="skills-grid">
          {SPOKEN_ENGLISH_SKILLS.map((skill, idx) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.35, delay: idx * 0.03, ease: EASE_OUT_EXPO }}
              className="skill"
            >
              {idx % 2 === 0 ? <Mic size={18} /> : <MessageCircle size={18} />}
              <span>{skill}</span>
            </motion.div>
          ))}
        </div>

        <FadeInUp
          className="build-banner"
          y={20}
          data-track-view="kids_age_tiers_banner"
          data-track-label="Kids Ages 4–14 Program & Poster Loaded"
          data-track-section="skills"
          data-track-interest="kids_program"
          data-track-course="Kids English Speaking Course (Ages 4–14)"
        >
          <div>
            <span className="eyebrow">Learn · Speak · Grow — Ages 4 to 14</span>
            <h2>
              Let Your Child Speak
              <br />
              with Real Confidence.
            </h2>
            <p className="section-intro">
              Fun learning and live 1-hour Google Meet video sessions Monday to Friday, with only
              6–8 students per session for personal speaking practice.
            </p>

            <div className="mt-5 p-1 rounded-xl bg-black/60 border border-white/10 inline-flex flex-wrap gap-1">
              {kidsTiers.map((tier, idx) => {
                const active = idx === selectedTierIdx;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => setSelectedTierIdx(idx)}
                    data-track-type="tab_select"
                    data-track-name={`banner_kids_tier_${idx + 1}`}
                    data-track-label={`Kids Tier ${tier.label} (${tier.fee})`}
                    data-track-interest="kids_program"
                    data-track-course={tier.course}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tier.label} · {tier.fee}
                  </button>
                );
              })}
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 mt-3 leading-relaxed">
              {activeTier.summary}
            </p>

            <div className="mt-6">
              <EnrollButton course={activeTier.course} label="Register Now" />
            </div>
          </div>

          <img
            src={ASSETS.kidsWelcomePoster}
            alt="The Language Spoken House — Kids Spoken English Program"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </FadeInUp>
      </div>
    </FadeInUp>
  );
}

export function ClassworkExercisesSection({
  tone = 'coral',
}: {
  tone?: 'coral' | 'muted' | 'default';
} = {}) {
  const [spotlightIdx, setSpotlightIdx] = useState<number | null>(null);

  const originParam =
    typeof window !== 'undefined'
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';

  const pillarIcons = [BookOpen, Users, Mic, MessageCircle];
  const sectionClass =
    tone === 'coral'
      ? 'section section-coral'
      : tone === 'muted'
        ? 'section section-muted'
        : 'section';

  const spotlightClip = spotlightIdx !== null ? CLASSWORK_VIDEOS[spotlightIdx] : null;

  return (
    <FadeInUp as="section" className={sectionClass} id="classwork">
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Exercises &amp; Live Classwork</span>
          <h2 className="section-heading">
            Practice inside class.
            <br />
            Speak with confidence outside.
          </h2>
          <p className="section-intro">
            Every live session combines guided speaking drills, real-life role-plays, and practical
            classwork activities so students actively use English instead of just memorizing rules.
          </p>
        </FadeInUp>

        <div className="feature-grid">
          {CLASSWORK_PILLARS.map((pillar, i) => {
            const Icon = pillarIcons[i] ?? BookOpen;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_ONCE}
                transition={{ duration: 0.45, delay: i * 0.07, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -3 }}
                className="feature"
              >
                <div className="feature-icon-box">
                  <Icon size={20} />
                </div>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#110f0f]/90 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="space-y-1 max-w-2xl">
              <span className="eyebrow !mb-1">Inside Our Live Sessions</span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Watch real classwork &amp; speaking exercise clips
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Tap any clip to play it directly, or open Spotlight View for a larger theater
                playback.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {spotlightClip ? (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => setSpotlightIdx(null)}
                  data-track-name="classwork_close_spotlight"
                >
                  <X />
                  Close Spotlight
                </Button>
              ) : null}
              <EnrollButton
                course="Free Trial Consultation / General Inquiry"
                label="Try 1 Free Class"
              />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {spotlightClip && spotlightIdx !== null && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                className="mb-7 rounded-2xl border border-primary/30 bg-black/80 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-6 items-center"
              >
                <div className="mx-auto w-full max-w-[300px] rounded-xl overflow-hidden border border-primary/25 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                  <iframe
                    key={`spotlight-${spotlightClip.id}`}
                    src={`${spotlightClip.embedUrl}&autoplay=1${originParam}`}
                    title={`Spotlight: ${spotlightClip.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full aspect-[9/16] max-h-[500px] border-0 block"
                  />
                </div>

                <div className="space-y-4">
                  <span className="eyebrow !mb-0">
                    {spotlightClip.badge} · Spotlight Player
                  </span>
                  <h4 className="text-xl sm:text-2xl font-bold text-foreground">
                    {spotlightClip.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                    {spotlightClip.focus}. Join our live Monday–Friday classrooms to practice
                    exercises like this with personal feedback.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSpotlightIdx(
                          (spotlightIdx + CLASSWORK_VIDEOS.length - 1) % CLASSWORK_VIDEOS.length
                        )
                      }
                      data-track-name="classwork_spotlight_prev"
                    >
                      <ChevronLeft />
                      Previous Clip
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSpotlightIdx((spotlightIdx + 1) % CLASSWORK_VIDEOS.length)
                      }
                      data-track-name="classwork_spotlight_next"
                    >
                      Next Clip
                      <ChevronRight />
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={spotlightClip.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-track-name="classwork_spotlight_youtube"
                        data-track-interest="stories"
                      >
                        <ExternalLink />
                        Watch on YouTube
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CLASSWORK_VIDEOS.map((clip, idx) => {
              const isSpotlight = spotlightIdx === idx;
              return (
                <motion.div
                  key={clip.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT_ONCE}
                  transition={{ duration: 0.4, delay: idx * 0.06, ease: EASE_OUT_EXPO }}
                  data-track-view={`classwork_video_${idx + 1}_${clip.id}`}
                  data-track-label={`Video Loaded: ${clip.badge} — ${clip.title}`}
                  data-track-section="classwork"
                  data-track-interest="stories"
                  className={`flex flex-col rounded-xl border bg-black/75 overflow-hidden transition-colors ${
                    isSpotlight
                      ? 'border-primary shadow-[0_12px_36px_rgba(188,239,18,0.16)]'
                      : 'border-white/10 hover:border-primary/40'
                  }`}
                >
                  <div className="relative w-full aspect-[9/16] bg-black border-b border-white/10">
                    <iframe
                      src={`${clip.embedUrl}${originParam}`}
                      title={`${clip.badge}: ${clip.title}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      loading="lazy"
                      className="w-full h-full border-0 block"
                    />
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold tracking-wider text-primary tabular-nums">
                        {String(idx + 1).padStart(2, '0')} · {clip.badge}
                      </span>
                      <h4 className="text-sm font-bold text-foreground leading-snug">
                        {clip.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{clip.focus}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setSpotlightIdx(isSpotlight ? null : idx)}
                        data-track-name={`classwork_spotlight_open_${idx + 1}`}
                        data-track-label={`Spotlight: ${clip.title}`}
                        data-track-interest="stories"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        <Play size={11} className="text-primary" />
                        {isSpotlight ? 'In Spotlight' : 'Spotlight'}
                      </button>

                      <a
                        href={clip.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-track-name={`classwork_video_youtube_${idx + 1}`}
                        data-track-label={`Classwork YouTube: ${clip.badge} — ${clip.title}`}
                        data-track-interest="stories"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <ExternalLink size={11} />
                        YouTube
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </FadeInUp>
  );
}

export function JourneySection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    ['Message on WhatsApp', `Send us your details on WhatsApp (${WHATSAPP_DISPLAY}).`],
    ['Free Consultation', 'We guide you to the right course & level.'],
    ['Free Trial Class', 'Join one class free before enrolling.'],
    ['Live Online Classes', 'Small batches, 1 hour, Monday–Friday.'],
    ['Daily Speaking Practice', 'Role-plays, dialogues, and live feedback.'],
    ['Get Your Certificate', 'Basic & Advanced session certificates.'],
  ];

  return (
    <FadeInUp
      as="section"
      className="section"
      id="journey"
      data-track-view="journey_6_steps"
      data-track-label="6 Simple Steps Journey Loaded"
      data-track-section="journey"
      data-track-interest="general_info"
    >
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Your Learning Journey</span>
          <h2 className="section-heading">6 Simple Steps</h2>
          <p className="section-intro mb-9">
            From your first conversation to your next achievement.
          </p>
        </FadeInUp>

        <div className="journey-grid">
          {steps.map(([title, desc], idx) => {
            const isActive = activeStep === idx;
            return (
              <motion.button
                key={title}
                type="button"
                onClick={() => setActiveStep(idx)}
                onMouseEnter={() => setActiveStep(idx)}
                data-track-name={`journey_step_${idx + 1}`}
                data-track-label={`Journey Step ${idx + 1}: ${title}`}
                data-track-interest="general_info"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_ONCE}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -3 }}
                className={`step text-left cursor-pointer ${
                  isActive ? '!border-primary/50 bg-primary/[0.05]' : ''
                }`}
              >
                <span className="step-number">0{idx + 1}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </FadeInUp>
  );
}

export function CertificatesSection() {
  const [filter, setFilter] = useState<'All' | 'Advanced' | 'Basic' | 'Completed'>('All');
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  const visibleCerts =
    filter === 'All' ? CERTIFICATES : CERTIFICATES.filter((c) => c.group === filter);

  const activePreview: PreviewImage | null =
    previewIdx !== null && visibleCerts[previewIdx]
      ? {
          name: `${visibleCerts[previewIdx].name} — ${visibleCerts[previewIdx].group} Certificate`,
          url: visibleCerts[previewIdx].image,
        }
      : null;

  const scrollRail = (direction: -1 | 1) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: direction * 340, behavior: 'smooth' });
  };

  return (
    <FadeInUp
      as="section"
      className="section section-muted"
      id="certificates"
      data-track-view="student_certificates_section"
      data-track-label="Our Proud Students Certificates Loaded"
      data-track-section="certificates"
      data-track-interest="certificates"
    >
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Verified Student Achievements</span>
          <h2 className="section-heading">Our Proud Students</h2>
        </FadeInUp>

        <div className="cert-controls-row">
          <div className="cert-filter-bar" role="tablist" aria-label="Certificate category filter">
            {(
              [
                { id: 'All', label: 'All Certificates' },
                { id: 'Advanced', label: 'Advanced Session' },
                { id: 'Basic', label: 'Basic Session' },
                { id: 'Completed', label: 'Course Completion' },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-track-name={`cert_filter_${tab.id.toLowerCase()}`}
                  data-track-interest="certificates"
                  onClick={() => {
                    setFilter(tab.id);
                    setPreviewIdx(null);
                  }}
                  className={`cert-filter-btn ${active ? 'active' : ''}`}
                >
                  {active && (
                    <motion.span
                      layoutId="cert-filter-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="cert-filter-pill"
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground tabular-nums mr-1">
              {visibleCerts.length} certificates
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Scroll certificates left"
              data-track-name="cert_scroll_left"
              data-track-interest="certificates"
              onClick={() => scrollRail(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Scroll certificates right"
              data-track-name="cert_scroll_right"
              data-track-interest="certificates"
              onClick={() => scrollRail(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <motion.div layout ref={railRef} className="cert-grid">
          <AnimatePresence mode="popLayout">
            {visibleCerts.map((cert, idx) => (
              <motion.div
                key={cert.name}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -4 }}
              >
                <Button
                  variant="ghost"
                  className="cert-card"
                  onClick={() => setPreviewIdx(idx)}
                  data-track-name={`cert_preview_${cert.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`}
                  data-track-label={`Certificate: ${cert.name} (${cert.group})`}
                  data-track-interest="certificates"
                  aria-label={`View ${cert.name} certificate`}
                >
                  <img
                    src={cert.image}
                    alt={`${cert.name} certificate`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <span className="cert-label">
                    <span>{cert.name}</span>
                    <small>{cert.group} ↗</small>
                  </span>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <ImageDialog
        preview={activePreview}
        onClose={() => setPreviewIdx(null)}
        onPrev={() =>
          setPreviewIdx((prev) =>
            prev === null ? null : (prev + visibleCerts.length - 1) % visibleCerts.length
          )
        }
        onNext={() =>
          setPreviewIdx((prev) => (prev === null ? null : (prev + 1) % visibleCerts.length))
        }
      />
    </FadeInUp>
  );
}

export function StoriesSection({ tone = 'default' }: { tone?: 'default' | 'muted' } = {}) {
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const stories = [
    {
      image: ASSETS.kidsEnglish,
      label: 'Kids’ progress',
      title: 'A young learner speaks',
      course: 'Kids English Speaking Course (Ages 4–14)',
    },
    {
      image: ASSETS.heroMain,
      label: 'Parent story',
      title: 'A parent shares the change',
      course: 'Kids English Speaking Course (Ages 4–14)',
    },
    {
      image: ASSETS.womenEnglish,
      label: 'Women’s progress',
      title: 'A woman finds her voice',
      course: 'Female English Speaking Course',
    },
  ];

  const activePreview: PreviewImage | null =
    previewIdx !== null && stories[previewIdx]
      ? {
          name: `${stories[previewIdx].title} (${stories[previewIdx].label})`,
          url: stories[previewIdx].image,
          course: stories[previewIdx].course,
        }
      : null;

  return (
    <FadeInUp
      as="section"
      className={tone === 'muted' ? 'section section-muted' : 'section'}
      id="voices"
      data-track-view="student_voices_stories"
      data-track-label="Student Voices & Stories Loaded"
      data-track-section="voices"
      data-track-interest="stories"
    >
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Real student voices</span>
          <h2 className="section-heading">Confidence you can hear</h2>
        </FadeInUp>

        <div className="story-grid mt-9">
          {stories.map((story, idx) => (
            <motion.button
              key={story.title}
              type="button"
              onClick={() => setPreviewIdx(idx)}
              data-track-name={`story_preview_${idx + 1}`}
              data-track-label={`Story: ${story.title}`}
              data-track-interest="stories"
              data-track-course={story.course}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -4 }}
              className="story text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="media-frame rounded-[14px]">
                <img
                  className="story-image"
                  src={story.image}
                  alt={story.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="eyebrow mt-5">{story.label}</span>
              <h3>{story.title}</h3>
              <p className="flex items-center gap-2">
                <Play size={13} className="text-primary" /> Tap to preview highlight
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      <ImageDialog
        preview={activePreview}
        onClose={() => setPreviewIdx(null)}
        onPrev={() =>
          setPreviewIdx((prev) =>
            prev === null ? null : (prev + stories.length - 1) % stories.length
          )
        }
        onNext={() =>
          setPreviewIdx((prev) => (prev === null ? null : (prev + 1) % stories.length))
        }
      />
    </FadeInUp>
  );
}

export function GlobalClassroomSection() {
  const { countryName, region } = useRegionPricing();
  const regions = ['Pakistan', 'UAE', 'Saudi Arabia', 'United Kingdom', 'More soon'];

  return (
    <FadeInUp
      as="section"
      className="section section-coral"
      id="global-classroom"
      data-track-view="global_classroom_section"
      data-track-label="Global Classroom Countries Loaded"
      data-track-section="global-classroom"
      data-track-interest="general_info"
    >
      <div className="shell split">
        <FadeInUp y={18}>
          <span className="eyebrow">Our global classroom</span>
          <h2 className="section-heading">Learn English from anywhere in the world.</h2>
          <p className="section-intro">
            One friendly live classroom, welcoming learners across time zones and cultures. Monthly
            tuition for <span className="text-foreground font-semibold">{countryName}</span> is{' '}
            <span className="text-primary font-bold tabular-nums">{region.monthlyPrice}/month</span>.
          </p>
          <div className="tags">
            {regions.map((item) => (
              <span key={item} className="tag">
                {item}
              </span>
            ))}
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1} y={18}>
          <img
            src={ASSETS.globalClassroom}
            alt="Women joining an online English class from different locations"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </FadeInUp>
      </div>
    </FadeInUp>
  );
}

export function TeachersSection() {
  return (
    <FadeInUp
      as="section"
      className="section"
      id="teachers"
      data-track-view="meet_our_teachers_section"
      data-track-label="Meet Your Guides / Teachers Section Loaded"
      data-track-section="teachers"
      data-track-interest="teacher_track"
    >
      <div className="shell split">
        <FadeInUp y={18}>
          <img
            src={ASSETS.teachers}
            alt="The Language Spoken House teaching team"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </FadeInUp>

        <FadeInUp delay={0.1} y={18}>
          <span className="eyebrow">Meet your guides</span>
          <h2 className="section-heading">
            Expert teachers.
            <br />
            Warm encouragement.
          </h2>
          <p className="section-intro">
            Our trainers create safe, active sessions where every learner gets time to speak and
            useful feedback to move forward.
          </p>
          <div className="tags">
            <span className="tag">Kids speaking</span>
            <span className="tag">Women’s fluency</span>
            <span className="tag">Teacher communication</span>
          </div>
          <div className="mt-7">
            <EnrollButton label="Meet a teacher" />
          </div>
        </FadeInUp>
      </div>
    </FadeInUp>
  );
}

export function ContactSection() {
  const { openBookingModal } = useBookingModal();

  const quickCourses = [
    {
      label: 'Kids Program (4–14)',
      course: 'Kids English Speaking Course (Ages 4–14)',
      interest: 'kids_program',
    },
    {
      label: 'Women’s Fluency',
      course: 'Female English Speaking Course',
      interest: 'womens_program',
    },
    {
      label: 'Teacher Communication',
      course: 'Teacher Communication Track',
      interest: 'teacher_track',
    },
  ];

  return (
    <FadeInUp
      as="section"
      className="section contact"
      id="contact"
      data-track-view="contact_journey_cta"
      data-track-label="Your Journey Starts Here CTA Loaded"
      data-track-section="contact"
      data-track-interest="trial_booking"
    >
      <div className="shell">
        <div className="contact-panel">
          <span className="eyebrow">Your first conversation starts here</span>
          <h2 className="section-heading">Your Journey Starts Here</h2>
          <p className="section-intro">
            Limited seats. Fill out your quick student details to message us on WhatsApp or call
            to book your free trial class without pressure.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {quickCourses.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => openBookingModal(item.course)}
                data-track-name={`contact_quick_${item.interest}`}
                data-track-label={`Quick Trial: ${item.label}`}
                data-track-interest={item.interest}
                data-track-course={item.course}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-white/15 bg-black/50 text-zinc-200 hover:border-primary/60 hover:text-primary transition-colors cursor-pointer whitespace-nowrap"
              >
                {item.label} →
              </button>
            ))}
          </div>

          <div className="contact-actions">
            <Button
              size="lg"
              type="button"
              data-track-name="contact_whatsapp_cta"
              data-track-interest="trial_booking"
              data-track-course="Free Trial Consultation / General Inquiry"
              onClick={() => openBookingModal('Free Trial Consultation / General Inquiry')}
            >
              <MessageCircle />
              WhatsApp {WHATSAPP_DISPLAY}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={PHONE_URL} data-track-name="contact_phone_call" data-track-interest="contact">
                <Phone />
                Call 0348-3452142
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={EMAIL_URL} data-track-name="contact_email_link" data-track-interest="contact">
                <Mail />
                {EMAIL_DISPLAY}
              </a>
            </Button>
          </div>

          <div className="contact-benefits">
            <span>Practical Learning</span>
            <span>Certificate Provided</span>
            <span>Career Growth</span>
            <span>Flexible Learning</span>
          </div>
        </div>
      </div>
    </FadeInUp>
  );
}

export function KidsAgePathsSection() {
  const { region } = useRegionPricing();
  const [selected, setSelected] = useState(0);

  const levels = [
    {
      name: 'Little Explorers',
      tag: `Ages 4–6 · ${region.monthlyPrice}/mo`,
      focus: 'Greetings, phonetic confidence, everyday classroom words, and playful speaking games.',
    },
    {
      name: 'Young Speakers',
      tag: `Ages 7–9 · ${region.monthlyPrice}/mo`,
      focus: 'Building full sentences, asking questions, colours, daily routines, and guided dialogue.',
    },
    {
      name: 'Smart Communicators',
      tag: `Ages 10–12 · ${region.monthlyPrice}/mo`,
      focus: 'Clear pronunciation, group discussions, vocabulary fluency, and real-world scenarios.',
    },
    {
      name: 'Young but advanced',
      tag: `Ages 12–14 · ${region.monthlyPrice}/mo`,
      focus: 'Storytelling, confident presentations, critical thinking, and expressive speaking.',
    },
  ];

  const active = levels[selected] ?? levels[0];

  return (
    <FadeInUp as="section" className="section section-muted">
      <div className="shell">
        <FadeInUp y={16}>
          <span className="eyebrow">Growing confidence at every age</span>
          <h2 className="section-heading">A path for every young speaker</h2>
        </FadeInUp>

        <CountryPriceBar className="mt-6 rounded-2xl border border-white/10 bg-[#110f0f]/85 px-4 py-3.5 sm:px-5" />

        <div className="feature-grid">
          {levels.map((level, idx) => {
            const isSelected = selected === idx;
            return (
              <motion.button
                key={level.name}
                type="button"
                onClick={() => setSelected(idx)}
                data-track-type="tab_select"
                data-track-name={`kids_age_path_${idx + 1}`}
                data-track-view={`kids_age_level_${idx + 1}`}
                data-track-label={`${level.name} (${level.tag})`}
                data-track-section="kids-age-paths"
                data-track-interest="kids_program"
                data-track-course={`Kids Spoken English — ${level.name}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_ONCE}
                transition={{ duration: 0.4, delay: idx * 0.06, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -3 }}
                className={`feature text-left cursor-pointer ${
                  isSelected ? '!border-primary/60 bg-primary/[0.06]' : ''
                }`}
              >
                <div className="feature-icon-box">
                  <BookOpen size={20} />
                </div>
                <h3>{level.name}</h3>
                <span className="tag mt-2 tabular-nums">{level.tag}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          key={`${active.name}-${region.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          className="mt-6 rounded-2xl border border-white/10 bg-card/90 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <span className="eyebrow !mb-1 tabular-nums">{active.tag}</span>
            <h3 className="text-lg font-bold text-foreground">{active.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{active.focus}</p>
          </div>
          <div className="shrink-0">
            <EnrollButton course={`Kids Spoken English — ${active.name}`} label="Book Free Demo" />
          </div>
        </motion.div>
      </div>
    </FadeInUp>
  );
}
