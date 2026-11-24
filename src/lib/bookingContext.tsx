import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { COURSE_OPTIONS } from '../data/siteData';
import { inferInterestCategory, trackEvent } from './analytics';

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
    const targetCourse = course || COURSE_OPTIONS[6];
    setDefaultCourse(targetCourse);
    setOpen(true);

    trackEvent({
      eventType: 'modal_open',
      eventName: 'open_booking_modal',
      label: `Booking Modal (${targetCourse})`,
      interestCategory: inferInterestCategory({
        course: targetCourse,
        text: targetCourse,
        screen: window.location.pathname,
      }),
      course: targetCourse,
    });
  }, []);

  const closeBookingModal = useCallback(() => {
    setOpen(false);
    trackEvent({
      eventType: 'modal_close',
      eventName: 'close_booking_modal',
      label: 'Close Booking Modal',
      interestCategory: 'trial_booking',
    });
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
