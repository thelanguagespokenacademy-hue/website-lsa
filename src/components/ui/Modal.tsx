import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Link, usePathname } from '../../lib/router';

interface NavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DRAWER_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/programs', label: 'Programs' },
  { to: '/english', label: 'English Courses' },
  { to: '/ai', label: 'AI Courses' },
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <aside className="fixed inset-y-0 left-0 z-50 h-full w-3/4 sm:max-w-sm border-r border-white/10 bg-[#09090b]/95 backdrop-blur-xl p-6 shadow-2xl animate-drawer-left overflow-y-auto">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground cursor-pointer transition-colors hover:bg-white/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <h2 className="text-lg font-bold text-foreground font-display">
          Language Spoken House
        </h2>
        <p className="text-sm text-primary mt-1 font-medium">Explore the house</p>

        <nav className="drawer-links" onClick={() => onOpenChange(false)}>
          {DRAWER_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={pathname === item.to ? 'drawer-active' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}

export interface PreviewImage {
  name: string;
  url: string;
}

interface ImageDialogProps {
  preview: PreviewImage | null;
  onClose: () => void;
}

export function ImageDialog({ preview, onClose }: ImageDialogProps) {
  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [preview, onClose]);

  if (!preview) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-dialog-title"
    >
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-white/15 bg-card p-6 shadow-2xl rounded-2xl image-dialog animate-dialog-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground cursor-pointer transition-colors hover:bg-white/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <h2
          id="image-dialog-title"
          className="text-lg font-semibold leading-none tracking-tight text-foreground pr-8"
        >
          {preview.name}
        </h2>
        <p className="sr-only">Course poster or student certificate</p>

        <img src={preview.url} alt={preview.name} referrerPolicy="no-referrer" />
      </div>
    </div>
  );
}
