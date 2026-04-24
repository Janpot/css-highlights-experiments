'use client';

import { useReportWebVitals } from 'next/web-vitals';

declare global {
  interface Window {
    __reportWebVital?: (payload: {
      name: string;
      value: number;
      id: string;
      rating: string;
      path: string;
    }) => void;
  }
}

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === 'undefined') return;
    if (typeof window.__reportWebVital !== 'function') return;
    window.__reportWebVital({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
      path: window.location.pathname,
    });
  });
  return null;
}
