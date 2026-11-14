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
  Globe,
  GraduationCap,
  Heart,
  MessageCircle,
  Mic,
  Phone,
  Play,
  Users,
  Video,
} from 'lucide-react';
import { Link } from '../lib/router';
import { useBookingModal } from '../lib/bookingContext';
import { Button } from './ui/Button';
import { FadeInUp } from './ui/FadeInUp';
import { ImageDialog, type PreviewImage } from './ui/Modal';
import {
  ASSETS,
  CERTIFICATES,
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

  return (
    <Button type="button" onClick={() => openBookingModal(course)}>
      {label}
      <ArrowRight />
    </Button>
  );
}

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slide = HERO_SLIDES[index] ?? HERO_SLIDES[0];

  const goNext = () => setIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  const goPrev = () => setIndex((prev) => (prev + HERO_SLIDES.length - 1) % HERO_SLIDES.length);

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
          <span className="live-label">LIVE · ONLINE · SPEAKING FIRST</span>
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
                  <Link to="/contact">
                    Book your free demo <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="hero" asChild>
                  <Link to="/programs">View programs</Link>
                </Button>
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
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`hero-dot ${i === index ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hero-counter">
              0{index + 1} / 0{HERO_SLIDES.length}
            </span>
            <Button variant="hero" size="icon" aria-label="Previous slide" onClick={goPrev}>
              <ArrowLeft />
            </Button>
            <Button variant="hero" size="icon" aria-label="Next slide" onClick={goNext}>
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
    <FadeInUp className="benefits" y={16} duration={0.45}>
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
      course: 'Kids Spoken English Program (Ages 4–6 · Rs. 133/Day)',
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
    <FadeInUp className="marquee-band" aria-label="Program visual highlights" y={20}>
      <div className="marquee-mask">
        <div className="marquee-track">
          {[...tiles, ...tiles].map((tile, idx) => (
            <button
              key={`${tile.title}-${idx}`}
              type="button"
              className="marquee-tile"
              onClick={() => setPreviewIdx(idx % tiles.length)}
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
    <FadeInUp as="section" className="section">
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
            >
              <div className="path-top">
                <div className="path-icon-box">
                  <Icon size={20} />
                </div>
                <span className="path-index">{index}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link className="text-link" to={to}>
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
      </div>
    </FadeInUp>
  );
}

export function EnglishProgramsSection({ onlyKids = false }: { onlyKids?: boolean }) {
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
          <span className="tag">1 day free trial class</span>
        </FadeInUp>

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
                  <span className="eyebrow">{course.age}</span>
                  <h3>{course.name}</h3>
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
                    <span className="text-xs text-muted-foreground">Mon–Fri · 1 Hr Live</span>
                  </div>

                  <div className="poster-options">
                    {course.posters.map((posterUrl, pIdx) => (
                      <Button
                        key={posterUrl}
                        variant="ghost"
                        className="poster-button"
                        aria-label={`View ${course.name} poster ${pIdx + 1}`}
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
                    <Link to="/kids-program" className="text-link">
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

        <div className="track-grid mt-9">
          {speakingTracks.map((course, idx) => (
            <motion.article
              key={course.name}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -5 }}
              className="track-card"
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

        <FadeInUp className="build-banner" y={20}>
          <div>
            <span className="eyebrow">Learn · Speak · Grow — Ages 4 to 14</span>
            <h2>
              Let Your Child Speak
              <br />
              with Real Confidence.
            </h2>
            <p className="section-intro">
              Fun learning and live 1-hour Google Meet video sessions Monday to Friday, with only
              7–8 students per session for personal speaking practice.
            </p>
            <p className="section-intro mt-4 tabular-nums">
              Ages 4–6: Rs. 133/Day · Ages 7–9: Rs. 145/Day · Ages 10–14: Rs. 155/Day
            </p>
            <div className="mt-6">
              <EnrollButton course="Kids Spoken English Program (Ages 4–14)" label="Register Now" />
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
    <FadeInUp as="section" className="section" id="journey">
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
    <FadeInUp as="section" className="section section-muted" id="certificates">
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
              onClick={() => scrollRail(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Scroll certificates right"
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

export function StoriesSection() {
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
    <FadeInUp as="section" className="section" id="voices">
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
  const regions = ['Pakistan', 'UAE', 'Saudi Arabia', 'United Kingdom', 'More soon'];

  return (
    <FadeInUp as="section" className="section section-coral">
      <div className="shell split">
        <FadeInUp y={18}>
          <span className="eyebrow">Our global classroom</span>
          <h2 className="section-heading">Learn English from anywhere in the world.</h2>
          <p className="section-intro">
            One friendly live classroom, welcoming learners across time zones and cultures.
          </p>
          <div className="tags">
            {regions.map((region) => (
              <span key={region} className="tag">
                {region}
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
    <FadeInUp as="section" className="section" id="teachers">
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

  return (
    <FadeInUp as="section" className="section contact" id="contact">
      <div className="shell">
        <div className="contact-panel">
          <span className="eyebrow">Your first conversation starts here</span>
          <h2 className="section-heading">Your Journey Starts Here</h2>
          <p className="section-intro">
            Limited seats. Fill out your quick student details to message us on WhatsApp or call
            to book your free trial class without pressure.
          </p>

          <div className="contact-actions">
            <Button
              size="lg"
              type="button"
              onClick={() => openBookingModal('Free Trial Consultation / General Inquiry')}
            >
              <MessageCircle />
              WhatsApp {WHATSAPP_DISPLAY}
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={PHONE_URL}>
                <Phone />
                Call 0348-3452142
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
  const [selected, setSelected] = useState(0);

  const levels = [
    {
      name: 'Little Explorers',
      tag: 'Ages 4–6 · Rs. 133/Day',
      focus: 'Greetings, phonetic confidence, everyday classroom words, and playful speaking games.',
    },
    {
      name: 'Young Speakers',
      tag: 'Ages 7–9 · Rs. 145/Day',
      focus: 'Building full sentences, asking questions, colours, daily routines, and guided dialogue.',
    },
    {
      name: 'Smart Communicators',
      tag: 'Ages 10–12 · Rs. 155/Day',
      focus: 'Clear pronunciation, group discussions, vocabulary fluency, and real-world scenarios.',
    },
    {
      name: 'Young but advanced',
      tag: 'Ages 12–14 · Rs. 155/Day',
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

        <div className="feature-grid">
          {levels.map((level, idx) => {
            const isSelected = selected === idx;
            return (
              <motion.button
                key={level.name}
                type="button"
                onClick={() => setSelected(idx)}
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
                <span className="tag mt-2">{level.tag}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          key={active.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          className="mt-6 rounded-2xl border border-white/10 bg-card/90 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <span className="eyebrow !mb-1">{active.tag}</span>
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
