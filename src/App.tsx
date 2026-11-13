import { Link, RouterProvider, usePathname } from './lib/router';
import {
  FloatingWhatsAppButton,
  MotionAndMetaEffect,
  SiteFooter,
  SiteHeader,
} from './components/Layout';
import {
  AiProgramsSection,
  BenefitsBar,
  CertificatesSection,
  ContactSection,
  EnglishProgramsSection,
  GlobalClassroomSection,
  HeroSlider,
  JourneySection,
  KidsAgePathsSection,
  PageTitle,
  ShowcaseMarquee,
  StoriesSection,
  TeachersSection,
  WhoAreYouSection,
  WhySection,
} from './components/SiteSections';

function HomePage() {
  return (
    <main>
      <HeroSlider />
      <BenefitsBar />
      <ShowcaseMarquee />
      <WhoAreYouSection />
      <WhySection />
      <div id="programs">
        <EnglishProgramsSection />
        <AiProgramsSection />
      </div>
      <JourneySection />
      <CertificatesSection />
      <StoriesSection />
      <GlobalClassroomSection />
      <TeachersSection />
      <ContactSection />
    </main>
  );
}

function AboutPage() {
  return (
    <main>
      <PageTitle title="Our difference" eyebrow="Why Language Spoken House?" />
      <WhySection />
      <GlobalClassroomSection />
      <ContactSection />
    </main>
  );
}

function AiPage() {
  return (
    <main>
      <PageTitle title="Build with AI" eyebrow="AI Branch" />
      <AiProgramsSection />
      <ContactSection />
    </main>
  );
}

function CertificatesPage() {
  return (
    <main>
      <PageTitle title="Student achievements" eyebrow="Our proud students" />
      <CertificatesSection />
      <ContactSection />
    </main>
  );
}

function ContactPage() {
  return (
    <main>
      <PageTitle title="Ready to start speaking?" eyebrow="Book your free demo" />
      <ContactSection />
      <WhoAreYouSection />
    </main>
  );
}

function EnglishPage() {
  return (
    <main>
      <PageTitle title="English speaking courses" eyebrow="English Speaking Branch" />
      <EnglishProgramsSection />
      <ContactSection />
    </main>
  );
}

function JourneyPage() {
  return (
    <main>
      <PageTitle title="Your learning journey" eyebrow="Simple by design" />
      <JourneySection />
      <ContactSection />
    </main>
  );
}

function KidsProgramPage() {
  return (
    <main>
      <PageTitle title="English Speaking Program for Kids" eyebrow="Ages 4–14" />
      <EnglishProgramsSection onlyKids />
      <KidsAgePathsSection />
      <ContactSection />
    </main>
  );
}

function ProgramsPage() {
  return (
    <main>
      <PageTitle title="Our programs" eyebrow="Find your path" />
      <EnglishProgramsSection />
      <AiProgramsSection />
      <ContactSection />
    </main>
  );
}

function StoriesPage() {
  return (
    <main>
      <PageTitle title="Student voices" eyebrow="Confidence you can hear" />
      <StoriesSection />
      <CertificatesSection />
    </main>
  );
}

function TeachersPage() {
  return (
    <main>
      <PageTitle title="Our teachers" eyebrow="Meet your guides" />
      <TeachersSection />
      <ContactSection />
    </main>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function RouteView() {
  const pathname = usePathname();

  switch (pathname) {
    case '/':
      return <HomePage />;
    case '/about':
      return <AboutPage />;
    case '/ai':
      return <AiPage />;
    case '/certificates':
      return <CertificatesPage />;
    case '/contact':
      return <ContactPage />;
    case '/english':
      return <EnglishPage />;
    case '/journey':
      return <JourneyPage />;
    case '/kids-program':
      return <KidsProgramPage />;
    case '/programs':
      return <ProgramsPage />;
    case '/stories':
      return <StoriesPage />;
    case '/teachers':
      return <TeachersPage />;
    default:
      return <NotFoundPage />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      <div className="ambient-backdrop" aria-hidden="true" />
      <SiteHeader />
      <RouteView />
      <MotionAndMetaEffect />
      <SiteFooter />
      <FloatingWhatsAppButton />
    </RouterProvider>
  );
}
