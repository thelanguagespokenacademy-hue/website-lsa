import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight, House, MessageCircle, PanelLeft } from 'lucide-react';
import { Link, usePathname } from '../lib/router';
import { useBookingModal } from '../lib/bookingContext';
import { Button } from './ui/Button';
import { NavDrawer } from './ui/Modal';
import { EMAIL_URL, ROUTE_META, WHATSAPP_DISPLAY } from '../data/siteData';
import { FadeInUp } from './ui/FadeInUp';

const HEADER_NAV_ITEMS = [
  { to: '/programs', label: 'Programs' },
  { to: '/about', label: 'Our difference' },
  { to: '/stories', label: 'Stories' },
  { to: '/teachers', label: 'Teachers' },
];

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <PanelLeft />
            </Button>
            <Link to="/" className="brand">
              <span className="brand-icon">
                <House size={19} />
              </span>
              <span>Language Spoken House</span>
            </Link>
          </div>

          <nav className="main-nav" aria-label="Main navigation">
            {HEADER_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={isActive ? 'nav-active' : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="header-nav-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="nav-active-pill"
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Button asChild className="header-demo">
            <Link to="/contact">Book free demo</Link>
          </Button>
        </div>

        <motion.div className="scroll-progress-bar" style={{ scaleX }} aria-hidden="true" />
      </header>

      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}

export function FloatingWhatsAppButton() {
  const { openBookingModal } = useBookingModal();

  return (
    <motion.button
      type="button"
      onClick={() => openBookingModal('Free Trial Consultation / General Inquiry')}
      className="floating-wa cursor-pointer"
      aria-label="Open booking form for WhatsApp"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
    >
      <MessageCircle size={18} />
      <span>Let’s have a chat!</span>
    </motion.button>
  );
}

export function SiteFooter() {
  const { openBookingModal } = useBookingModal();

  return (
    <FadeInUp as="footer" className="footer" y={20}>
      <div className="shell">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand">
              <span className="brand-icon">
                <House size={18} />
              </span>
              Language Spoken House
            </Link>
            <p className="mt-4">
              The destination for practical English mastery, confident speaking and real-life
              communication for kids, women and teachers worldwide.
            </p>
          </div>

          <div>
            <h4>Programs</h4>
            <Link to="/kids-program">Kids English</Link>
            <Link to="/english">Women’s Spoken</Link>
            <Link to="/teachers">Teacher Communication</Link>
            <Link to="/journey">Learning Journey</Link>
          </div>

          <div>
            <h4>Quick links</h4>
            <Link to="/about">About us</Link>
            <Link to="/stories">Student voices</Link>
            <Link to="/certificates">Certificates</Link>
            <Link to="/contact">Free Demo</Link>
          </div>

          <div>
            <h4>Start a conversation</h4>
            <p>Learn Today · Grow Tomorrow · A Brighter You</p>
            <button
              type="button"
              onClick={() => openBookingModal('Free Trial Consultation / General Inquiry')}
              className="mt-3 block text-left text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
            >
              WhatsApp {WHATSAPP_DISPLAY} ↗
            </button>
            <a href={EMAIL_URL}>
              Email us <ArrowUpRight className="inline" size={13} />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Language Spoken House. All rights reserved.</span>
          <span>Live learning. Real confidence.</span>
        </div>
      </div>
    </FadeInUp>
  );
}

export function MotionAndMetaEffect() {
  const pathname = usePathname();

  useEffect(() => {
    const meta = ROUTE_META[pathname] ?? ROUTE_META['/'];
    document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', meta.description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);
  }, [pathname]);

  return null;
}
