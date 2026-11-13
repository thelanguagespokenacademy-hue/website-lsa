import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Clock,
  Code,
  Globe,
  GraduationCap,
  Heart,
  MessageCircle,
  Mic,
  Phone,
  Play,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import { Link } from '../lib/router';
import { Button } from './ui/Button';
import { ImageDialog, type PreviewImage } from './ui/Modal';
import {
  AI_SKILLS,
  ASSETS,
  CERTIFICATES,
  HERO_SLIDES,
  PHONE_URL,
  WHATSAPP_URL,
} from '../data/siteData';

export function PageTitle({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="shell page-title">
      <Link to="/">
        <ArrowLeft size={14} /> Back to the house
      </Link>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
    </div>
  );
}

export function EnrollButton({
  course,
  label = 'Enroll',
}: {
  course?: string;
  label?: string;
}) {
  const href = course
    ? `${WHATSAPP_URL}?text=${encodeURIComponent(
        `Hello! I’m interested in the ${course}. I would like to book a free trial class.`
      )}`
    : WHATSAPP_URL;

  return (
    <Button asChild>
      <a href={href} target="_blank" rel="noreferrer">
        {label}
        <ArrowRight />
      </a>
    </Button>
  );
}

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = HERO_SLIDES[index] ?? HERO_SLIDES[0];

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
    >
      <div className="hero-glow" aria-hidden="true" />
      <img
        key={slide.image}
        className="hero-image"
        src={slide.image}
        alt="A welcoming English learning classroom"
        referrerPolicy="no-referrer"
      />
      <span className="live-label">LIVE · ONLINE · SPEAKING FIRST</span>

      <div className="shell hero-inner">
        <div className="hero-copy" key={index}>
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
        </div>
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

        <div className="flex items-center gap-2">
          <span className="hero-counter">
            0{index + 1} / 0{HERO_SLIDES.length}
          </span>
          <Button
            variant="hero"
            size="icon"
            aria-label="Previous slide"
            onClick={() => setIndex((index + HERO_SLIDES.length - 1) % HERO_SLIDES.length)}
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="hero"
            size="icon"
            aria-label="Next slide"
            onClick={() => setIndex((index + 1) % HERO_SLIDES.length)}
          >
            <ArrowRight />
          </Button>
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
    <div className="benefits">
      {items.map(({ Icon, text }) => (
        <span key={text}>
          <Icon />
          {text}
        </span>
      ))}
    </div>
  );
}

export function ShowcaseMarquee() {
  const [preview, setPreview] = useState<PreviewImage | null>(null);

  const tiles = [
    { title: 'Kids English Speaking', tag: 'Ages 4–14', url: ASSETS.kidsEnglish },
    { title: 'Women’s Spoken English', tag: 'Daily & Work', url: ASSETS.womenEnglish },
    { title: 'Kids AI Program', tag: '6 Months', url: ASSETS.aiKids },
    { title: 'Women AI Course', tag: '4 Months', url: ASSETS.aiWomen },
    { title: 'Advanced AI Generation', tag: 'Build Tools', url: ASSETS.aiAdvanced },
    { title: 'Global Live Classroom', tag: 'Worldwide', url: ASSETS.globalClassroom },
    { title: 'Expert Trainers', tag: 'Live Feedback', url: ASSETS.teachers },
  ];

  return (
    <div className="marquee-band" aria-label="Program visual highlights">
      <div className="marquee-mask">
        <div className="marquee-track">
          {[...tiles, ...tiles].map((tile, idx) => (
            <button
              key={`${tile.title}-${idx}`}
              type="button"
              className="marquee-tile"
              onClick={() => setPreview({ name: tile.title, url: tile.url })}
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

      <ImageDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
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
    <section className="section">
      <div className="shell">
        <span className="eyebrow">Start where you are</span>
        <h2 className="section-heading">Who are you here for?</h2>
        <p className="section-intro">
          Choose the path that fits your goal. Every class is live, practical, and built for
          confident speaking.
        </p>

        <div className="path-grid mt-9">
          {paths.map(({ index, Icon, title, text, to, cta }) => (
            <div key={title} className="path">
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
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <section className="section section-coral" id="why">
      <div className="shell">
        <span className="eyebrow">Why Language Spoken House?</span>
        <h2 className="section-heading">
          We don’t just teach English.
          <br />
          We make you speak it.
        </h2>
        <p className="section-intro">
          Speaking is not saved for the end of a lesson. It is how every lesson begins, grows, and
          becomes useful in real life.
        </p>

        <div className="feature-grid">
          {features.map(({ Icon, title, text }) => (
            <div key={title} className="feature">
              <div className="feature-icon-box">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EnglishProgramsSection({ onlyKids = false }: { onlyKids?: boolean }) {
  const [preview, setPreview] = useState<PreviewImage | null>(null);

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
      posters: [ASSETS.kidsPoster1, ASSETS.kidsPoster2],
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

  return (
    <section className="section" id="english">
      <div className="shell">
        <div className="section-top">
          <div>
            <span className="eyebrow">English Speaking Branch</span>
            <h2 className="section-heading">Speak English, Speak Confidently!</h2>
            <p className="section-intro">
              Our spoken English programs for growing voices and everyday confidence.
            </p>
          </div>
          <span className="tag">1 day free trial class</span>
        </div>

        <div className="course-grid">
          {courses
            .filter((_, idx) => !onlyKids || idx === 0)
            .map((course) => (
              <article key={course.name} className="course-card">
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
                    {course.posters.map((posterUrl, idx) => (
                      <Button
                        key={posterUrl}
                        variant="ghost"
                        className="poster-button"
                        aria-label={`View ${course.name} poster ${idx + 1}`}
                        onClick={() => setPreview({ url: posterUrl, name: course.name })}
                      >
                        <img
                          src={posterUrl}
                          alt={`${course.name} poster ${idx + 1}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </Button>
                    ))}
                    <span className="poster-hint">Tap to view posters</span>
                  </div>

                  {course.name.startsWith('Kids') && (
                    <Link to="/kids-program" className="text-link">
                      Explore kids program <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </article>
            ))}
        </div>
      </div>

      <ImageDialog preview={preview} onClose={() => setPreview(null)} />
    </section>
  );
}

export function AiProgramsSection() {
  const aiCourses = [
    {
      name: 'Kids AI Course',
      duration: '6 Months',
      text: 'Fun · Creative · Future Ready',
      image: ASSETS.aiKids,
    },
    {
      name: 'Women AI Course',
      duration: '4 Months',
      text: 'Learn · Practice · Create',
      image: ASSETS.aiWomen,
    },
    {
      name: 'Advanced AI Generation',
      duration: 'For girls & women',
      text: 'Build AI-powered tools',
      image: ASSETS.aiAdvanced,
    },
  ];

  return (
    <section className="section section-muted" id="ai">
      <div className="shell">
        <span className="eyebrow">AI Branch</span>
        <h2 className="section-heading">From AI User to AI Creator</h2>
        <p className="section-intro">
          Don’t just use AI — make your own AI. Practical, hands-on learning for kids, girls and
          women.
        </p>

        <div className="ai-grid mt-9">
          {aiCourses.map((course) => (
            <article key={course.name} className="ai-card">
              <div className="media-frame">
                <img
                  className="ai-poster"
                  src={course.image}
                  alt={course.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="ai-body">
                <span className="eyebrow">{course.duration}</span>
                <h3>{course.name}</h3>
                <p>{course.text}</p>
                <EnrollButton course={course.name} />
              </div>
            </article>
          ))}
        </div>

        <h3 className="certificate-heading">What You’ll Learn</h3>
        <div className="skills-grid">
          {AI_SKILLS.map((skill, idx) => (
            <div key={skill} className="skill">
              {idx % 2 === 0 ? <Code size={18} /> : <Sparkles size={18} />}
              <span>{skill}</span>
            </div>
          ))}
        </div>

        <div className="build-banner">
          <div>
            <span className="eyebrow">Learn Today · Grow Tomorrow · A Brighter You</span>
            <h2>
              Speak English Confidently.
              <br />
              Build with AI.
            </h2>
            <p className="section-intro">
              Live online classes for kids, girls and women — English speaking and AI skills, in
              small batches of only 6 students, taught in Urdu &amp; English.
            </p>
            <p className="section-intro mt-4">Stop using AI. Start building with AI!</p>
            <div className="mt-6">
              <EnrollButton label="Enroll Now" />
            </div>
          </div>

          <img
            src={ASSETS.aiBanner}
            alt="AI course — learn, practice and create"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </section>
  );
}

export function JourneySection() {
  const steps = [
    ['Message on WhatsApp', 'Send us a message on 0307-5882858.'],
    ['Free Consultation', 'We guide you to the right course & level.'],
    ['Free Trial Class', 'Join one class free before enrolling.'],
    ['Live Online Classes', 'Small batches, 1 hour, Monday–Friday.'],
    ['Practice & Projects', 'Speak daily, build real AI projects.'],
    ['Get Your Certificate', 'Basic & Advanced session certificates.'],
  ];

  return (
    <section className="section" id="journey">
      <div className="shell">
        <span className="eyebrow">Your Learning Journey</span>
        <h2 className="section-heading">6 Simple Steps</h2>
        <p className="section-intro mb-9">
          From your first conversation to your next achievement.
        </p>

        <div className="journey-grid">
          {steps.map(([title, desc], idx) => (
            <div key={title} className="step">
              <span className="step-number">0{idx + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CertificatesSection() {
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const [filter, setFilter] = useState<'All' | 'Advanced' | 'Basic' | 'Completed'>('All');
  const allGroups: Array<'Advanced' | 'Basic' | 'Completed'> = ['Advanced', 'Basic', 'Completed'];
  const visibleGroups = filter === 'All' ? allGroups : [filter];

  return (
    <section className="section section-muted" id="certificates">
      <div className="shell">
        <span className="eyebrow">Verified Student Achievements</span>
        <h2 className="section-heading">Our Proud Students</h2>

        <div className="cert-filter-bar" role="tablist" aria-label="Certificate category filter">
          {(
            [
              { id: 'All', label: 'All Certificates' },
              { id: 'Advanced', label: 'Advanced Session' },
              { id: 'Basic', label: 'Basic Session' },
              { id: 'Completed', label: 'Course Completion' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`cert-filter-btn ${filter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {visibleGroups.map((group) => (
          <div key={group}>
            <h3 className="certificate-heading">
              {group === 'Completed' ? 'Course Completion' : `${group} Session`} Certificates
            </h3>

            <div className="cert-grid">
              {CERTIFICATES.filter((cert) => cert.group === group).map((cert) => (
                <Button
                  key={cert.name}
                  variant="ghost"
                  className="cert-card"
                  onClick={() =>
                    setPreview({
                      name: `${cert.name} — ${cert.group} Certificate`,
                      url: cert.image,
                    })
                  }
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
              ))}
            </div>
          </div>
        ))}
      </div>

      <ImageDialog preview={preview} onClose={() => setPreview(null)} />
    </section>
  );
}

export function StoriesSection() {
  const stories = [
    { image: ASSETS.kidsEnglish, label: 'Kids’ progress', title: 'A young learner speaks' },
    { image: ASSETS.heroMain, label: 'Parent story', title: 'A parent shares the change' },
    { image: ASSETS.womenEnglish, label: 'Women’s progress', title: 'A woman finds her voice' },
  ];

  return (
    <section className="section" id="voices">
      <div className="shell">
        <span className="eyebrow">Real student voices</span>
        <h2 className="section-heading">Confidence you can hear</h2>

        <div className="story-grid mt-9">
          {stories.map((story) => (
            <article key={story.title} className="story">
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
                <Play size={13} className="text-primary" /> Video coming soon
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GlobalClassroomSection() {
  const regions = ['Pakistan', 'UAE', 'Saudi Arabia', 'United Kingdom', 'More soon'];

  return (
    <section className="section section-coral">
      <div className="shell split">
        <div>
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
        </div>

        <img
          src={ASSETS.globalClassroom}
          alt="Women joining an online English class from different locations"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    </section>
  );
}

export function TeachersSection() {
  return (
    <section className="section" id="teachers">
      <div className="shell split">
        <img
          src={ASSETS.teachers}
          alt="The Language Spoken House teaching team"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        <div>
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
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section className="section contact" id="contact">
      <div className="shell">
        <div className="contact-panel">
          <span className="eyebrow">Your first conversation starts here</span>
          <h2 className="section-heading">Your Journey Starts Here</h2>
          <p className="section-intro">
            Limited seats. Message us on WhatsApp or call to book your free trial class. Meet a
            teacher, experience the class, and find the right program without pressure.
          </p>

          <div className="contact-actions">
            <Button size="lg" asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                <MessageCircle />
                WhatsApp 0307-5882858
              </a>
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
    </section>
  );
}

export function KidsAgePathsSection() {
  const levels = [
    { name: 'Little Explorers', tag: 'Greetings' },
    { name: 'Young Speakers', tag: 'Colours' },
    { name: 'Smart Communicators', tag: 'Animals' },
    { name: 'Young but advanced', tag: 'Storytelling' },
  ];

  return (
    <section className="section section-muted">
      <div className="shell">
        <span className="eyebrow">Growing confidence at every age</span>
        <h2 className="section-heading">A path for every young speaker</h2>

        <div className="feature-grid">
          {levels.map((level) => (
            <div key={level.name} className="feature">
              <div className="feature-icon-box">
                <BookOpen size={20} />
              </div>
              <h3>{level.name}</h3>
              <span className="tag mt-2">{level.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
