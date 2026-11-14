import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { COURSE_OPTIONS } from '../data/siteData';

interface BookingContextValue {
  open: boolean;
  defaultCourse: string;
  openBookingModal: (course?: string) => void;
  closeBookingModal: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultCourse, setDefaultCourse] = useState<string>(COURSE_OPTIONS[0]);

  const openBookingModal = useCallback((course?: string) => {
    if (course) {
      setDefaultCourse(course);
    } else {
      setDefaultCourse(COURSE_OPTIONS[6]);
    }
    setOpen(true);
  }, []);

  const closeBookingModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <BookingContext.Provider value={{ open, defaultCourse, openBookingModal, closeBookingModal }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingModal() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBookingModal must be used inside BookingProvider');
  }
  return ctx;
}
